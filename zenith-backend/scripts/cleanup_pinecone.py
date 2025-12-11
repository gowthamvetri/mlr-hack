"""
Pinecone Cleanup Script
Deletes all vectors from all namespaces to start fresh
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

def cleanup_pinecone():
    """Delete all vectors from all namespaces in Pinecone"""
    
    print("🧹 Starting Pinecone Cleanup...")
    print("=" * 60)
    
    # Initialize Pinecone
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ Error: PINECONE_API_KEY not found in environment")
        return False
    
    pc = Pinecone(api_key=api_key)
    
    index_name = os.getenv("PINECONE_INDEX_NAME", "smart-campus-rag")
    print(f"📍 Connecting to index: {index_name}")
    
    try:
        index = pc.Index(index_name)
        
        # Get index stats to see namespaces
        stats = index.describe_index_stats()
        namespaces = stats.get('namespaces', {})
        
        if not namespaces:
            print("✅ Index is already empty (no namespaces found)")
            return True
        
        print(f"\n📊 Found {len(namespaces)} namespace(s):")
        for ns_name, ns_stats in namespaces.items():
            vector_count = ns_stats.get('vector_count', 0)
            print(f"   • {ns_name}: {vector_count} vectors")
        
        print(f"\n⚠️  WARNING: This will delete ALL vectors from ALL namespaces!")
        confirm = input("Type 'YES' to confirm deletion: ")
        
        if confirm.strip().upper() != "YES":
            print("❌ Cleanup cancelled")
            return False
        
        print("\n🗑️  Deleting vectors...")
        
        # Delete all vectors from each namespace
        deleted_count = 0
        for ns_name in namespaces.keys():
            try:
                # Delete all vectors in this namespace
                index.delete(delete_all=True, namespace=ns_name)
                vector_count = namespaces[ns_name].get('vector_count', 0)
                deleted_count += vector_count
                print(f"   ✅ Deleted {vector_count} vectors from '{ns_name}'")
            except Exception as e:
                print(f"   ❌ Error deleting from '{ns_name}': {e}")
        
        print(f"\n✨ Cleanup complete! Deleted {deleted_count} total vectors")
        
        # Verify cleanup
        print("\n🔍 Verifying cleanup...")
        stats_after = index.describe_index_stats()
        namespaces_after = stats_after.get('namespaces', {})
        
        if not namespaces_after:
            print("✅ Verification successful: Index is now empty")
        else:
            remaining = sum(ns.get('vector_count', 0) for ns in namespaces_after.values())
            if remaining == 0:
                print("✅ Verification successful: All vectors deleted")
            else:
                print(f"⚠️  Warning: {remaining} vectors still remain")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  PINECONE CLEANUP SCRIPT")
    print("  Remove all embeddings/chunks from database")
    print("="*60 + "\n")
    
    success = cleanup_pinecone()
    
    if success:
        print("\n" + "="*60)
        print("  ✅ You can now upload fresh content!")
        print("="*60)
        sys.exit(0)
    else:
        print("\n❌ Cleanup failed")
        sys.exit(1)
