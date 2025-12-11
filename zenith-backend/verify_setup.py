"""
Setup Verification Script
Run this to verify your installation and configuration
"""
import sys
import os

def check_python_version():
    """Check Python version"""
    print("🔍 Checking Python version...")
    version = sys.version_info
    if version.major == 3 and version.minor >= 10:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro}")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor}.{version.micro} (Need 3.10+)")
        return False

def check_env_file():
    """Check .env file exists"""
    print("\n🔍 Checking .env file...")
    if os.path.exists(".env"):
        print("   ✅ .env file found")
        return True
    else:
        print("   ❌ .env file not found")
        print("   💡 Copy .env.example to .env and fill in your credentials")
        return False

def check_dependencies():
    """Check if dependencies are installed"""
    print("\n🔍 Checking dependencies...")
    required = [
        "fastapi",
        "uvicorn",
        "motor",
        "pinecone",
        "openai",
        "reportlab",
        "pydantic"
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} (missing)")
            missing.append(package)
    
    if missing:
        print(f"\n   💡 Install missing packages:")
        print(f"      pip install {' '.join(missing)}")
        return False
    return True

def check_env_variables():
    """Check environment variables"""
    print("\n🔍 Checking environment variables...")
    
    # Load .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("   ⚠️  python-dotenv not installed")
        print("      pip install python-dotenv")
        return False
    
    required_vars = [
        "MONGODB_URI",
        "PINECONE_API_KEY",
        "PINECONE_INDEX_NAME",
        "OPENAI_API_KEY"
    ]
    
    missing = []
    for var in required_vars:
        value = os.getenv(var)
        if value and value != f"your_{var.lower()}_here":
            print(f"   ✅ {var}")
        else:
            print(f"   ❌ {var} (not set or using placeholder)")
            missing.append(var)
    
    if missing:
        print(f"\n   💡 Set these variables in .env file:")
        for var in missing:
            print(f"      {var}=your_actual_value_here")
        return False
    return True

def check_directories():
    """Check required directories"""
    print("\n🔍 Checking directories...")
    required_dirs = [
        "app",
        "app/schemas",
        "app/models",
        "app/services",
        "app/routers",
        "app/rag",
        "app/pdf",
        "app/utils",
        "generated_reports"
    ]
    
    all_exist = True
    for directory in required_dirs:
        if os.path.exists(directory):
            print(f"   ✅ {directory}")
        else:
            print(f"   ❌ {directory} (missing)")
            all_exist = False
    
    return all_exist

def test_imports():
    """Test importing app modules"""
    print("\n🔍 Testing imports...")
    
    try:
        from app import config
        print("   ✅ app.config")
    except Exception as e:
        print(f"   ❌ app.config: {str(e)}")
        return False
    
    try:
        from app import database
        print("   ✅ app.database")
    except Exception as e:
        print(f"   ❌ app.database: {str(e)}")
        return False
    
    try:
        from app import schemas
        print("   ✅ app.schemas")
    except Exception as e:
        print(f"   ❌ app.schemas: {str(e)}")
        return False
    
    try:
        from app import services
        print("   ✅ app.services")
    except Exception as e:
        print(f"   ❌ app.services: {str(e)}")
        return False
    
    try:
        from app import main
        print("   ✅ app.main")
    except Exception as e:
        print(f"   ❌ app.main: {str(e)}")
        return False
    
    return True

def main():
    """Run all checks"""
    print("=" * 60)
    print("🎓 MLRIT Chatbot Setup Verification")
    print("=" * 60)
    
    checks = [
        ("Python Version", check_python_version),
        (".env File", check_env_file),
        ("Dependencies", check_dependencies),
        ("Environment Variables", check_env_variables),
        ("Directories", check_directories),
        ("Module Imports", test_imports)
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n   ❌ Error during {name} check: {str(e)}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Verification Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {name}")
    
    print("\n" + "=" * 60)
    print(f"Result: {passed}/{total} checks passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All checks passed! You're ready to run the application.")
        print("\n📝 Next steps:")
        print("   1. python seed_data.py  (to populate sample data)")
        print("   2. python -m uvicorn app.main:app --reload")
        print("   3. Visit http://localhost:8000/docs")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\n💡 Quick fixes:")
        print("   - Install dependencies: pip install -r requirements.txt")
        print("   - Copy .env.example to .env and update values")
        print("   - Ensure all directories exist")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
