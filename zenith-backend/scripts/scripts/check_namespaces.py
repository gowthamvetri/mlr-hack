"""
Check Pinecone Namespaces - See what's in your database
"""
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_namespaces():
    """Check what namespaces exist in Pinecone"""
    
    print("\n" + "="*60)
    print("  PINECONE NAMESPACE CHECKER")
    print("="*60)
    
    # Initialize Pinecone
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ Error: PINECONE_API_KEY not found in environment")
        return False
    
    pc = Pinecone(api_key=api_key)
    
    index_name = os.getenv("PINECONE_INDEX_NAME", "smart-campus-rag")
    print(f"\n📍 Checking index: {index_name}")
    
    try:
        index = pc.Index(index_name)
        
        # Get index stats
        stats = index.describe_index_stats()
        namespaces = stats.get('namespaces', {})
        
        if not namespaces:
            print("\n❌ No namespaces found! Database is empty.")
            print("\n💡 Upload content via Admin Panel to create namespaces")
            return True
        
        print(f"\n✅ Found {len(namespaces)} namespace(s):\n")
        
        total_vectors = 0
        for ns_name, ns_stats in namespaces.items():
            vector_count = ns_stats.get('vector_count', 0)
            total_vectors += vector_count
            print(f"   📁 {ns_name}")
            print(f"      └─ {vector_count} vectors (chunks)")
        
        print(f"\n📊 Total: {total_vectors} vectors across {len(namespaces)} namespace(s)")
        
        print("\n" + "="*60)
        print("  WHAT THIS MEANS:")
        print("="*60)
        print("\n✅ These are the categories you've uploaded content to.")
        print("✅ When chatbot detects a category, it searches that namespace.")
        print("✅ If detection fails, it searches ALL namespaces above.")
        
        print("\n💡 TIP: Use descriptive category names like:")
        print("   • 'about-mlrit' instead of 'total'")
        print("   • 'facilities' for campus facilities")
        print("   • 'placements' for placement info")
        print("   • 'academics' for programs/departments")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = check_namespaces()
    print("\n" + "="*60)
    sys.exit(0 if success else 1)
