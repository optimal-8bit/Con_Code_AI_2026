#!/usr/bin/env python3
"""
Helper script to generate secure secrets for deployment
Run: python generate_secrets.py
"""

import secrets
import string

def generate_jwt_secret(length=64):
    """Generate a secure random JWT secret"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def generate_api_key(length=32):
    """Generate a secure random API key"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    print("=" * 70)
    print("🔐 Secure Secrets Generator for NextGen Health Deployment")
    print("=" * 70)
    print()
    
    print("📝 Copy these values to your Render environment variables:")
    print()
    
    print("JWT_SECRET (for backend):")
    print(generate_jwt_secret())
    print()
    
    print("Alternative JWT_SECRET (if you need another one):")
    print(generate_jwt_secret())
    print()
    
    print("=" * 70)
    print("✅ Keep these secrets safe and never commit them to Git!")
    print("=" * 70)
