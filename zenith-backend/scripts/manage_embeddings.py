"""
Embedding Management Script for MLRIT Chatbot
Allows you to delete specific chunks or all embeddings from Pinecone

Usage:
    python scripts/manage_embeddings.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from pinecone import Pinecone
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Pinecone
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "mlrit")

if not PINECONE_API_KEY:
    logger.error("❌ PINECONE_API_KEY not found in environment variables")
    sys.exit(1)

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Available namespaces
NAMESPACES = [
    "events",
    "placements", 
    "interviews",
    "internships",
    "skills",
    "resume_guides",
    "clubs",
    "scholarships"
]


def get_index_stats():
    """Get current index statistics"""
    try:
        stats = index.describe_index_stats()
        return stats
    except Exception as e:
        logger.error(f"❌ Error getting index stats: {e}")
        return None


def display_stats():
    """Display current index statistics"""
    print("\n" + "="*60)
    print("📊 CURRENT PINECONE INDEX STATISTICS")
    print("="*60)
    
    stats = get_index_stats()
    if not stats:
        return
    
    print(f"Index Name: {PINECONE_INDEX_NAME}")
    print(f"Total Vectors: {stats.total_vector_count}")
    print(f"\nVectors by Namespace:")
    
    if stats.namespaces:
        for ns, ns_stats in stats.namespaces.items():
            print(f"  • {ns}: {ns_stats.vector_count} vectors")
    else:
        print("  No vectors found")
    
    print("="*60 + "\n")


def delete_by_namespace(namespace):
    """Delete all vectors in a specific namespace"""
    try:
        print(f"\n🗑️  Deleting all vectors from namespace: {namespace}")
        index.delete(delete_all=True, namespace=namespace)
        logger.info(f"✅ Successfully deleted all vectors from namespace '{namespace}'")
        return True
    except Exception as e:
        logger.error(f"❌ Error deleting namespace '{namespace}': {e}")
        return False


def delete_by_document_id(document_id, namespace):
    """Delete all chunks of a specific document"""
    try:
        print(f"\n🗑️  Deleting document: {document_id} from namespace: {namespace}")
        
        # Pinecone uses prefix matching for IDs
        # Our chunk IDs are formatted as: {document_id}_chunk_{i}
        # We need to fetch and delete by IDs
        
        # Query to find all chunks with this document_id prefix
        results = index.query(
            vector=[0.0] * 768,  # Dummy vector
            top_k=10000,  # Max to fetch all chunks
            include_metadata=True,
            namespace=namespace,
            filter={"document_id": document_id}
        )
        
        if not results.matches:
            logger.warning(f"⚠️  No vectors found for document_id: {document_id}")
            return False
        
        # Extract IDs to delete
        ids_to_delete = [match.id for match in results.matches]
        
        # Delete by IDs
        index.delete(ids=ids_to_delete, namespace=namespace)
        
        logger.info(f"✅ Successfully deleted {len(ids_to_delete)} chunks from document '{document_id}'")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error deleting document '{document_id}': {e}")
        return False


def delete_all_embeddings():
    """Delete all vectors from all namespaces"""
    print("\n🗑️  Deleting ALL embeddings from ALL namespaces...")
    print("⚠️  This will remove all data from the index!\n")
    
    confirm = input("Type 'DELETE ALL' to confirm: ")
    if confirm != "DELETE ALL":
        print("❌ Deletion cancelled")
        return False
    
    success_count = 0
    for namespace in NAMESPACES:
        try:
            index.delete(delete_all=True, namespace=namespace)
            logger.info(f"✅ Cleared namespace: {namespace}")
            success_count += 1
        except Exception as e:
            logger.error(f"❌ Error clearing namespace '{namespace}': {e}")
    
    print(f"\n✅ Successfully cleared {success_count}/{len(NAMESPACES)} namespaces")
    return True


def list_documents_in_namespace(namespace):
    """List all unique documents in a namespace"""
    try:
        # Query to get vectors from namespace
        results = index.query(
            vector=[0.0] * 768,
            top_k=10000,
            include_metadata=True,
            namespace=namespace
        )
        
        if not results.matches:
            print(f"  No documents found in '{namespace}'")
            return []
        
        # Extract unique document IDs
        doc_ids = set()
        for match in results.matches:
            if match.metadata and "document_id" in match.metadata:
                doc_ids.add(match.metadata["document_id"])
        
        return sorted(list(doc_ids))
        
    except Exception as e:
        logger.error(f"❌ Error listing documents in '{namespace}': {e}")
        return []


def interactive_delete_by_document():
    """Interactive menu to delete specific documents"""
    print("\n📂 SELECT NAMESPACE:")
    for i, ns in enumerate(NAMESPACES, 1):
        print(f"  {i}. {ns}")
    
    try:
        choice = int(input("\nEnter namespace number (1-8): "))
        if choice < 1 or choice > len(NAMESPACES):
            print("❌ Invalid choice")
            return
        
        namespace = NAMESPACES[choice - 1]
        
        print(f"\n🔍 Fetching documents from '{namespace}'...")
        doc_ids = list_documents_in_namespace(namespace)
        
        if not doc_ids:
            print(f"No documents found in '{namespace}'")
            return
        
        print(f"\n📄 DOCUMENTS IN '{namespace}':")
        for i, doc_id in enumerate(doc_ids, 1):
            print(f"  {i}. {doc_id}")
        
        doc_choice = int(input(f"\nEnter document number to delete (1-{len(doc_ids)}): "))
        if doc_choice < 1 or doc_choice > len(doc_ids):
            print("❌ Invalid choice")
            return
        
        selected_doc = doc_ids[doc_choice - 1]
        
        confirm = input(f"\n⚠️  Delete '{selected_doc}' from '{namespace}'? (yes/no): ")
        if confirm.lower() == 'yes':
            delete_by_document_id(selected_doc, namespace)
        else:
            print("❌ Deletion cancelled")
            
    except ValueError:
        print("❌ Invalid input")
    except Exception as e:
        logger.error(f"❌ Error: {e}")


def main_menu():
    """Display main menu and handle user choices"""
    while True:
        print("\n" + "="*60)
        print("🗄️  PINECONE EMBEDDINGS MANAGEMENT")
        print("="*60)
        print("\nOptions:")
        print("  1. View index statistics")
        print("  2. Delete specific document chunks")
        print("  3. Delete all vectors from a namespace")
        print("  4. Delete ALL embeddings (fresh start)")
        print("  5. Exit")
        print("="*60)
        
        try:
            choice = input("\nEnter your choice (1-5): ").strip()
            
            if choice == "1":
                display_stats()
                
            elif choice == "2":
                interactive_delete_by_document()
                
            elif choice == "3":
                print("\n📂 SELECT NAMESPACE TO CLEAR:")
                for i, ns in enumerate(NAMESPACES, 1):
                    print(f"  {i}. {ns}")
                
                ns_choice = int(input("\nEnter namespace number (1-8): "))
                if 1 <= ns_choice <= len(NAMESPACES):
                    namespace = NAMESPACES[ns_choice - 1]
                    confirm = input(f"\n⚠️  Delete ALL vectors from '{namespace}'? (yes/no): ")
                    if confirm.lower() == 'yes':
                        delete_by_namespace(namespace)
                    else:
                        print("❌ Deletion cancelled")
                else:
                    print("❌ Invalid choice")
                    
            elif choice == "4":
                delete_all_embeddings()
                
            elif choice == "5":
                print("\n👋 Goodbye!")
                break
                
            else:
                print("❌ Invalid choice. Please enter 1-5.")
                
        except ValueError:
            print("❌ Invalid input. Please enter a number.")
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    print("\n🚀 Starting Pinecone Embeddings Manager...")
    
    # Display initial stats
    display_stats()
    
    # Start interactive menu
    main_menu()
