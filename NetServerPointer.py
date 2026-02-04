from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

# Dictionnaire pour garder en mémoire le dernier état connu de chaque employé
last_status = {}

@app.route('/punch', methods=['POST'])
def punch():
    data = request.json
    user_id = data.get('userId')
    current_action = data.get('action') # "ENTER" ou "EXIT"
    
    # On ne logue que si l'état a changé (ex: passe de ENTER à EXIT)
    if user_id not in last_status or last_status[user_id] != current_action:
        last_status[user_id] = current_action
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open("registre_wifi.csv", "a") as f:
            f.write(f"{timestamp},{user_id},{current_action}\n")
            
        print(f"Changement d'état pour {user_id} : {current_action}")
        return jsonify({"status": "updated"}), 200
    
    return jsonify({"status": "no_change"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
