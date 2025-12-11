"""
Quick script to delete ALL embeddings from Pinecone
Use this for a complete fresh start

Usage:
    python scripts/delete_all_embeddings.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "mlrit")

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

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

def main():
    print("\n" + "="*60)
    print("⚠️  DELETE ALL EMBEDDINGS FROM PINECONE")
    print("="*60)
    
    # Show current stats
    try:
        stats = index.describe_index_stats()
        print(f"\nCurrent total vectors: {stats.total_vector_count}")
        
        if stats.namespaces:
            print("\nVectors by namespace:")
            for ns, ns_stats in stats.namespaces.items():
                print(f"  • {ns}: {ns_stats.vector_count} vectors")
    except Exception as e:
        print(f"Error getting stats: {e}")
    
    print("\n" + "="*60)
    print("⚠️  WARNING: This will DELETE ALL embeddings!")
    print("="*60)
    
    confirm = input("\nType 'YES DELETE ALL' to confirm: ")
    
    if confirm != "YES DELETE ALL":
        print("\n❌ Deletion cancelled. Exiting safely.")
        return
    
    print("\n🗑️  Deleting all embeddings...")
    
    success_count = 0
    for namespace in NAMESPACES:
        try:
            print(f"  Clearing namespace: {namespace}...", end=" ")
            index.delete(delete_all=True, namespace=namespace)
            print("✅")
            success_count += 1
        except Exception as e:
            # 404 means namespace is empty/doesn't exist - that's fine
            if "404" in str(e) or "Namespace not found" in str(e):
                print("⚪ (empty)")
                success_count += 1
            else:
                print(f"❌ Error: {e}")
    
    print(f"\n✅ Successfully cleared {success_count}/{len(NAMESPACES)} namespaces")
    print("🎉 Your Pinecone index is now empty and ready for fresh uploads!\n")

if __name__ == "__main__":
    main()
