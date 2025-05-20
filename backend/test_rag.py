import os
import sys
from app.utils.document_processor import DocumentProcessor
from app.services.rag_service import RAGService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_document_processing():
    """Test document processing functionality"""
    # Set up paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sample_doc_path = os.path.join(current_dir, "test_data", "sample_document.txt")
    vector_db_path = os.path.join(current_dir, "test_vector_db")
    
    if not os.path.exists(sample_doc_path):
        logger.error(f"Sample document not found at {sample_doc_path}")
        sys.exit(1)
    
    # Create a test directory for vector database
    os.makedirs(vector_db_path, exist_ok=True)
    
    try:
        # Initialize document processor
        doc_processor = DocumentProcessor(vector_db_path=vector_db_path)
        logger.info("Document processor initialized")
        
        # Process the sample document
        logger.info(f"Processing document: {sample_doc_path}")
        chat_id = 999  # Test chat ID
        chunks_with_metadata = doc_processor.process_document(
            file_path=sample_doc_path,
            chat_id=chat_id
        )
        
        logger.info(f"Document processed into {len(chunks_with_metadata)} chunks")
        
        # Add chunks to vector store
        collection_name = f"test_chat_{chat_id}"
        vectorstore = doc_processor.add_documents_to_vectorstore(
            chunks_with_metadata=chunks_with_metadata,
            collection_name=collection_name
        )
        logger.info(f"Chunks added to vector store with collection name: {collection_name}")
        
        # Test similarity search
        test_queries = [
            "Syllexa AI nedir?",
            "Disleksik bireyler için ne gibi özellikler var?",
            "RAG teknolojisi nasıl kullanılıyor?"
        ]
        
        for query in test_queries:
            logger.info(f"\nTesting query: {query}")
            results = doc_processor.search_similar_chunks(query, collection_name)
            
            logger.info(f"Found {len(results)} relevant chunks")
            for i, (content, metadata, score) in enumerate(results):
                logger.info(f"Result {i+1} (Score: {score:.4f}):")
                logger.info(f"Content: {content[:100]}...")
                logger.info(f"Source: {metadata.get('source', 'Unknown')}")
        
        # Test RAG service
        rag_service = RAGService()
        
        for query in test_queries:
            logger.info(f"\nTesting RAG service with query: {query}")
            enhanced_prompt = rag_service.enhance_prompt_with_context(query, chat_id)
            logger.info(f"Enhanced prompt preview: {enhanced_prompt[:200]}...")
            
            context_items = rag_service.retrieve_relevant_context(query, chat_id)
            logger.info(f"Retrieved {len(context_items)} context items")
            
        return True
        
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    logger.info("Starting RAG system test...")
    success = test_document_processing()
    
    if success:
        logger.info("✅ RAG system test completed successfully!")
    else:
        logger.error("❌ RAG system test failed!") 