"""
Admin tools for managing the NextGen Health system.
"""
import sys
import os

BACKEND_ROOT = os.path.dirname(os.path.abspath(__file__))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app.services.data_service import (
    user_service,
    inventory_service,
    order_service,
    appointment_service,
    prescription_service,
)


def list_users_by_role(role: str):
    """List all users of a specific role."""
    users = user_service.list_by_role(role, limit=100)
    print(f"\n{role.upper()}S ({len(users)}):")
    print("=" * 80)
    for user in users:
        print(f"ID: {user['id']}")
        print(f"Name: {user['name']}")
        print(f"Email: {user['email']}")
        if role == "doctor":
            print(f"Specialty: {user.get('profile', {}).get('specialty', 'N/A')}")
        elif role == "pharmacy":
            print(f"Pharmacy: {user.get('profile', {}).get('pharmacy_name', 'N/A')}")
        print("-" * 80)


def list_pharmacy_inventory(pharmacy_email: str):
    """List inventory for a specific pharmacy."""
    # Find pharmacy by email
    pharmacy = user_service.col.find_one({"email": pharmacy_email, "role": "pharmacy"})
    if not pharmacy:
        print(f"❌ Pharmacy not found: {pharmacy_email}")
        return
    
    from app.db.mongo import serialize_doc
    pharmacy = serialize_doc(pharmacy)
    
    inventory = inventory_service.list_all(pharmacy["id"])
    print(f"\n📦 INVENTORY for {pharmacy['name']}:")
    print("=" * 80)
    print(f"{'Medicine':<30} {'Quantity':<10} {'Price':<10} {'Low Stock':<10}")
    print("-" * 80)
    
    for item in inventory:
        low_stock = "⚠️ YES" if item.get("is_low_stock") else "No"
        print(f"{item['medicine_name']:<30} {item['quantity']:<10} ${item['price_per_unit']:<9.2f} {low_stock:<10}")
    
    print(f"\nTotal items: {len(inventory)}")


def list_orders(pharmacy_email: str = None):
    """List orders for a pharmacy or all orders."""
    if pharmacy_email:
        pharmacy = user_service.col.find_one({"email": pharmacy_email, "role": "pharmacy"})
        if not pharmacy:
            print(f"❌ Pharmacy not found: {pharmacy_email}")
            return
        from app.db.mongo import serialize_doc
        pharmacy = serialize_doc(pharmacy)
        orders = order_service.list_for_pharmacy(pharmacy["id"], limit=100)
        print(f"\n📋 ORDERS for {pharmacy['name']}:")
    else:
        orders = list(order_service.col.find().sort("created_at", -1).limit(50))
        from app.db.mongo import serialize_docs
        orders = serialize_docs(orders)
        print(f"\n📋 ALL ORDERS:")
    
    print("=" * 80)
    for order in orders:
        print(f"Order ID: {order['id'][:8]}...")
        print(f"Status: {order['status']} | Payment: {order['payment_status']}")
        print(f"Total: ${order['total']:.2f} | Medicines: {len(order['medicines'])}")
        print(f"Created: {order['created_at']}")
        print("-" * 80)
    
    print(f"\nTotal orders: {len(orders)}")


def list_appointments(doctor_email: str = None):
    """List appointments for a doctor or all appointments."""
    if doctor_email:
        doctor = user_service.col.find_one({"email": doctor_email, "role": "doctor"})
        if not doctor:
            print(f"❌ Doctor not found: {doctor_email}")
            return
        from app.db.mongo import serialize_doc
        doctor = serialize_doc(doctor)
        appointments = appointment_service.list_for_doctor(doctor["id"], limit=100)
        print(f"\n📅 APPOINTMENTS for {doctor['name']}:")
    else:
        appointments = list(appointment_service.col.find().sort("scheduled_at", -1).limit(50))
        from app.db.mongo import serialize_docs
        appointments = serialize_docs(appointments)
        print(f"\n📅 ALL APPOINTMENTS:")
    
    print("=" * 80)
    for appt in appointments:
        print(f"Appointment ID: {appt['id'][:8]}...")
        print(f"Status: {appt['status']}")
        print(f"Scheduled: {appt['scheduled_at']}")
        print(f"Reason: {appt.get('reason', 'N/A')}")
        print("-" * 80)
    
    print(f"\nTotal appointments: {len(appointments)}")


def system_stats():
    """Display system statistics."""
    from app.db.mongo import mongo_service
    
    print("\n📊 SYSTEM STATISTICS")
    print("=" * 80)
    
    # Count users by role
    patients = user_service.col.count_documents({"role": "patient"})
    doctors = user_service.col.count_documents({"role": "doctor"})
    pharmacies = user_service.col.count_documents({"role": "pharmacy"})
    
    print(f"👥 Users:")
    print(f"   Patients: {patients}")
    print(f"   Doctors: {doctors}")
    print(f"   Pharmacies: {pharmacies}")
    print(f"   Total: {patients + doctors + pharmacies}")
    
    # Count appointments
    total_appts = appointment_service.col.count_documents({})
    pending_appts = appointment_service.col.count_documents({"status": "pending"})
    completed_appts = appointment_service.col.count_documents({"status": "completed"})
    
    print(f"\n📅 Appointments:")
    print(f"   Total: {total_appts}")
    print(f"   Pending: {pending_appts}")
    print(f"   Completed: {completed_appts}")
    
    # Count orders
    total_orders = order_service.col.count_documents({})
    pending_orders = order_service.col.count_documents({"status": "pending"})
    paid_orders = order_service.col.count_documents({"payment_status": "paid"})
    
    print(f"\n📦 Orders:")
    print(f"   Total: {total_orders}")
    print(f"   Pending: {pending_orders}")
    print(f"   Paid: {paid_orders}")
    
    # Count prescriptions
    total_rx = prescription_service.col.count_documents({})
    dispensed_rx = prescription_service.col.count_documents({"status": "dispensed"})
    
    print(f"\n💊 Prescriptions:")
    print(f"   Total: {total_rx}")
    print(f"   Dispensed: {dispensed_rx}")
    
    # Count inventory items
    total_inventory = inventory_service.col.count_documents({})
    
    print(f"\n📦 Inventory:")
    print(f"   Total items: {total_inventory}")
    
    print("=" * 80)


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Admin tools for NextGen Health")
    parser.add_argument("command", choices=[
        "stats",
        "list-doctors",
        "list-pharmacies",
        "list-patients",
        "list-inventory",
        "list-orders",
        "list-appointments",
    ])
    parser.add_argument("--email", help="Email for specific user queries")
    
    args = parser.parse_args()
    
    if args.command == "stats":
        system_stats()
    elif args.command == "list-doctors":
        list_users_by_role("doctor")
    elif args.command == "list-pharmacies":
        list_users_by_role("pharmacy")
    elif args.command == "list-patients":
        list_users_by_role("patient")
    elif args.command == "list-inventory":
        if not args.email:
            print("❌ Please provide --email for pharmacy")
            return
        list_pharmacy_inventory(args.email)
    elif args.command == "list-orders":
        list_orders(args.email)
    elif args.command == "list-appointments":
        list_appointments(args.email)


if __name__ == "__main__":
    main()
