#!/usr/bin/env python3
"""
Pre-deployment validation script
Checks if all required files and configurations are in place
Run: python validate_deployment.py
"""

import os
import sys
import json
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {filepath}")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists"""
    if os.path.isdir(dirpath):
        print(f"✅ {description}: {dirpath}")
        return True
    else:
        print(f"❌ {description} NOT FOUND: {dirpath}")
        return False

def check_env_file(filepath, required_vars):
    """Check if .env file has required variables"""
    if not os.path.exists(filepath):
        print(f"❌ Environment file NOT FOUND: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    missing_vars = []
    for var in required_vars:
        if var not in content:
            missing_vars.append(var)
    
    if missing_vars:
        print(f"⚠️  {filepath} is missing variables: {', '.join(missing_vars)}")
        return False
    else:
        print(f"✅ {filepath} has all required variables")
        return True

def check_package_json(filepath):
    """Check if package.json has required scripts"""
    if not os.path.exists(filepath):
        print(f"❌ package.json NOT FOUND: {filepath}")
        return False
    
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    required_scripts = ['build', 'dev']
    scripts = data.get('scripts', {})
    
    missing_scripts = [s for s in required_scripts if s not in scripts]
    
    if missing_scripts:
        print(f"⚠️  {filepath} is missing scripts: {', '.join(missing_scripts)}")
        return False
    else:
        print(f"✅ {filepath} has all required scripts")
        return True

def main():
    print("=" * 70)
    print("🔍 Pre-Deployment Validation for NextGen Health Platform")
    print("=" * 70)
    print()
    
    all_checks_passed = True
    
    # Check root files
    print("📁 Checking Root Configuration Files...")
    all_checks_passed &= check_file_exists("render.yaml", "Render configuration")
    all_checks_passed &= check_file_exists("DEPLOYMENT_GUIDE.md", "Deployment guide")
    all_checks_passed &= check_file_exists("DEPLOYMENT_CHECKLIST.md", "Deployment checklist")
    print()
    
    # Check backend
    print("🔧 Checking Backend Service...")
    all_checks_passed &= check_directory_exists("backend", "Backend directory")
    all_checks_passed &= check_file_exists("backend/requirements.txt", "Backend requirements")
    all_checks_passed &= check_file_exists("backend/app/main.py", "Backend main file")
    
    backend_env_vars = [
        "GEMINI_API_KEY",
        "MONGODB_URI",
        "JWT_SECRET",
        "CORS_ORIGINS"
    ]
    if os.path.exists("backend/.env"):
        all_checks_passed &= check_env_file("backend/.env", backend_env_vars)
    else:
        print("⚠️  backend/.env not found (you'll need to set these in Render)")
    print()
    
    # Check AI service
    print("🤖 Checking AI Service...")
    all_checks_passed &= check_directory_exists("ai-service", "AI service directory")
    all_checks_passed &= check_file_exists("ai-service/requirements.txt", "AI service requirements")
    all_checks_passed &= check_file_exists("ai-service/main.py", "AI service main file")
    
    ai_env_vars = [
        "GOOGLE_API_KEY",
        "MONGO_URI"
    ]
    if os.path.exists("ai-service/.env"):
        all_checks_passed &= check_env_file("ai-service/.env", ai_env_vars)
    else:
        print("⚠️  ai-service/.env not found (you'll need to set these in Render)")
    print()
    
    # Check frontend
    print("🌐 Checking Frontend...")
    all_checks_passed &= check_directory_exists("Web", "Frontend directory")
    all_checks_passed &= check_file_exists("Web/package.json", "Frontend package.json")
    all_checks_passed &= check_file_exists("Web/vite.config.js", "Vite configuration")
    all_checks_passed &= check_file_exists("Web/index.html", "Frontend index.html")
    all_checks_passed &= check_file_exists("Web/vercel.json", "Vercel configuration")
    
    if os.path.exists("Web/package.json"):
        all_checks_passed &= check_package_json("Web/package.json")
    
    if os.path.exists("Web/.env"):
        print("✅ Web/.env exists (remember to set VITE_API_URL in Vercel)")
    else:
        print("⚠️  Web/.env not found (you'll need to set VITE_API_URL in Vercel)")
    print()
    
    # Check Git
    print("📦 Checking Git Repository...")
    if os.path.exists(".git"):
        print("✅ Git repository initialized")
        
        # Check if .gitignore exists and has important entries
        if os.path.exists(".gitignore"):
            with open(".gitignore", 'r') as f:
                gitignore_content = f.read()
            
            important_ignores = [".env", "node_modules", "__pycache__", ".venv"]
            missing_ignores = [ig for ig in important_ignores if ig not in gitignore_content]
            
            if missing_ignores:
                print(f"⚠️  .gitignore should include: {', '.join(missing_ignores)}")
            else:
                print("✅ .gitignore has important entries")
        else:
            print("⚠️  .gitignore not found")
            all_checks_passed = False
    else:
        print("❌ Git repository not initialized")
        print("   Run: git init && git add . && git commit -m 'Initial commit'")
        all_checks_passed = False
    print()
    
    # Summary
    print("=" * 70)
    if all_checks_passed:
        print("✅ All validation checks passed!")
        print()
        print("🚀 You're ready to deploy!")
        print()
        print("Next steps:")
        print("1. Push your code to GitHub/GitLab/Bitbucket")
        print("2. Follow DEPLOYMENT_CHECKLIST.md")
        print("3. Deploy backend to Render")
        print("4. Deploy frontend to Vercel")
        print("5. Connect services and test")
    else:
        print("⚠️  Some validation checks failed!")
        print()
        print("Please fix the issues above before deploying.")
        print("Refer to DEPLOYMENT_GUIDE.md for detailed instructions.")
    print("=" * 70)
    
    return 0 if all_checks_passed else 1

if __name__ == "__main__":
    sys.exit(main())
