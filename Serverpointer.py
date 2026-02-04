from flask import Flask, request, jsonify
from datetime import datetime
import csv

app = Flask(__name__)

# Fichier de log pour simuler la machine à pointer
LOG_FILE = "pointage_registre.csv"

def log_event(user_id, status):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([timestamp, user_id, status])
    print(f"[{timestamp}] - {user_id} s'est {status}")

@app.route('/punch', methods=['POST'])
def punch():
    data = request.json
    user_id = data.get('userId')
    action = data.get('action') # "ENTER" ou "EXIT"
    
    if action == "ENTER":
        log_event(user_id, "CHECK-IN")
    else:
        log_event(user_id, "CHECK-OUT")
        
    return jsonify({"status": "success", "message": f"Pointage {action} enregistré"}), 200

if __name__ == '__main__':
    # Remplacez '0.0.0.0' pour écouter sur tout le réseau local
    app.run(host='0.0.0.0', port=5000)
