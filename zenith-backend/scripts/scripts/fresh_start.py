"""
Quick Start Script - Reset Everything and Start Fresh
"""
import subprocess
import sys
import os
from pathlib import Path

def run_command(command, description):
    """Run a command and show output"""
    print(f"\n{'='*60}")
    print(f"  {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(e.stderr)
        return False

def main():
    print("\n" + "="*60)
    print("  MLRIT CHATBOT - FRESH START")
    print("  This will clean Pinecone and restart backend")
    print("="*60)
    
    # Step 1: Cleanup Pinecone
    print("\n📍 Step 1: Cleaning Pinecone database...")
    backend_dir = Path(__file__).parent.parent
    cleanup_script = backend_dir / "scripts" / "cleanup_pinecone.py"
    
    if not cleanup_script.exists():
        print(f"❌ Cleanup script not found: {cleanup_script}")
        return False
    
    if not run_command(f'python "{cleanup_script}"', "Running Pinecone Cleanup"):
        print("\n❌ Cleanup failed. Please run manually:")
        print(f"   python {cleanup_script}")
        return False
    
    # Step 2: Restart backend
    print("\n📍 Step 2: Restarting backend with gemini-1.5-flash...")
    print("\n⚠️  Note: This script will exit. Please run backend manually:")
    print("   cd d:\\Projects\\Zenith\\backend")
    print("   uvicorn app.main:app --reload")
    
    print("\n" + "="*60)
    print("  ✅ CLEANUP COMPLETE!")
    print("="*60)
    print("\nNext steps:")
    print("1. Restart backend (see command above)")
    print("2. Go to Admin Panel (http://localhost:3000)")
    print("3. Upload your MLRIT content")
    print("4. Test in Chatbot")
    print("\n" + "="*60)
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
