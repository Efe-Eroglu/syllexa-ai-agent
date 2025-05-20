import os
import numpy as np
import pypdf
import docx
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer
from ..core.config import settings

class DocumentProcessor:
    """
    Handles processing of documents for RAG (Retrieval Augmented Generation)
    Supports PDF, DOCX, and TXT files
    """
    
    def __init__(self, vector_db_path="./vector_db"):
        """Initialize document processor with vector database path"""
        self.vector_db_path = vector_db_path
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        # Check if OpenAI API key is available from settings, otherwise use local model
        if settings.OPENAI_API_KEY:
            self.embeddings = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY)
            self.use_local_model = False
        else:
            # Use local sentence-transformers model for embeddings
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.use_local_model = True
            self.embeddings = None  # Set embeddings to None for local model
            
    def extract_text_from_pdf(self, file_path):
        """Extract text from PDF file"""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = pypdf.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            return text
        except Exception as e:
            print(f"Error extracting text from PDF: {e}")
            return ""
            
    def extract_text_from_docx(self, file_path):
        """Extract text from DOCX file"""
        try:
            doc = docx.Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs if paragraph.text])
            return text
        except Exception as e:
            print(f"Error extracting text from DOCX: {e}")
            return ""
            
    def extract_text_from_txt(self, file_path):
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            print(f"Error extracting text from TXT: {e}")
            return ""
    
    def process_document(self, file_path, chat_id, metadata=None):
        """Process document based on file extension"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        file_ext = os.path.splitext(file_path)[1].lower()
        
        if not metadata:
            metadata = {"source": os.path.basename(file_path), "chat_id": str(chat_id)}
        
        # Extract text based on file type
        if file_ext == '.pdf':
            text = self.extract_text_from_pdf(file_path)
        elif file_ext == '.docx':
            text = self.extract_text_from_docx(file_path)
        elif file_ext == '.txt':
            text = self.extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
        if not text:
            raise ValueError(f"Could not extract text from {file_path}")
            
        # Split text into chunks
        chunks = self.text_splitter.split_text(text)
        
        # Return chunks with metadata
        return [(chunk, metadata) for chunk in chunks]
    
    def add_documents_to_vectorstore(self, chunks_with_metadata, collection_name):
        """Add document chunks to vector store with specified collection name"""
        # Create vector store directory if it doesn't exist
        os.makedirs(self.vector_db_path, exist_ok=True)
        persist_dir = f"{self.vector_db_path}/{collection_name}"
        
        texts = [chunk for chunk, _ in chunks_with_metadata]
        metadatas = [metadata for _, metadata in chunks_with_metadata]
        
        # Use OpenAI embeddings if available, otherwise use local model
        if not self.use_local_model and self.embeddings:
            vectorstore = Chroma.from_texts(
                texts=texts,
                metadatas=metadatas,
                embedding=self.embeddings,
                persist_directory=persist_dir
            )
        else:
            # Create embeddings with local model
            embeddings_list = self.model.encode(texts)
            
            # Convert to format expected by Chroma
            ids = [f"id_{i}" for i in range(len(texts))]
            
            # Create Chroma client directly
            import chromadb
            client = chromadb.PersistentClient(path=persist_dir)
            
            # Create or get collection
            collection = client.get_or_create_collection(name=collection_name)
            
            # Add documents to collection
            collection.add(
                ids=ids,
                embeddings=embeddings_list.tolist(),
                documents=texts,
                metadatas=metadatas
            )
            
            # Create Langchain wrapper for the client
            vectorstore = Chroma(
                client=client,
                collection_name=collection_name
            )
            
        return vectorstore
    
    def search_similar_chunks(self, query, collection_name, limit=5):
        """Search for similar chunks in the vector store"""
        try:
            persist_dir = f"{self.vector_db_path}/{collection_name}"
            
            if not self.use_local_model and self.embeddings:
                # Use OpenAI embeddings
                vectorstore = Chroma(
                    persist_directory=persist_dir,
                    embedding_function=self.embeddings
                )
                results = vectorstore.similarity_search_with_score(query, k=limit)
                return [(doc.page_content, doc.metadata, score) for doc, score in results]
            else:
                # Use local model
                import chromadb
                client = chromadb.PersistentClient(path=persist_dir)
                collection = client.get_collection(name=collection_name)
                
                # Generate query embedding
                query_embedding = self.model.encode([query])[0]
                
                # Perform search
                results = collection.query(
                    query_embeddings=[query_embedding.tolist()],
                    n_results=limit,
                    include=["documents", "metadatas", "distances"]
                )
                
                # Format results
                formatted_results = []
                if results["documents"] and results["documents"][0]:
                    for i, (doc, metadata, distance) in enumerate(zip(
                        results["documents"][0], 
                        results["metadatas"][0],
                        results["distances"][0]
                    )):
                        # Convert distance to score (1 - distance) since lower distance is better
                        score = 1.0 - min(distance, 1.0)  # Normalize to [0,1] range
                        formatted_results.append((doc, metadata, score))
                
                return formatted_results
        except Exception as e:
            print(f"Error searching vector store: {e}")
            import traceback
            traceback.print_exc()
            return [] 