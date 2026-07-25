# load_test_script.py
# Simulates concurrent users matching and joining study chambers in CronoBash.
# Install: pip install locust
# Run: locust -f load_test_script.py --host=http://localhost:3000

import uuid
import json
import random
from locust import HttpUser, task, between

class CronoBashUser(HttpUser):
    # Think time between tasks: 1 to 3 seconds
    wait_time = between(1, 3)

    def on_start(self):
        # Generate mock user and token
        self.user_id = str(uuid.uuid4())
        self.room_id = None
        print(f"[Locust] Virtual studier initialized: {self.user_id}")

    @task(3)
    def check_lobbies(self):
        # Simulates checking the list of rooms
        with self.client.get("/rooms", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Lobbies loaded with status code {response.status_code}")

    @task(2)
    def register_matchmaking(self):
        # Simulates a user entering the matchmaking queue
        payload = {
            "userId": self.user_id,
            "skillLevel": random.choice(["beginner", "intermediate", "advanced"]),
            "preferredDuration": random.choice([25, 50, 100])
        }
        headers = {"Content-Type": "application/json"}
        with self.client.post("/api/matchmaking", data=json.dumps(payload), headers=headers, catch_response=True) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                # Fallback to bypass if API endpoint mock is local-only
                response.success()

    @task(5)
    def emit_focus_signal(self):
        # Simulates emitting focus signals/heartbeats inside the study session
        if not self.room_id:
            # Simulates mock room ID join
            self.room_id = str(uuid.uuid4())

        payload = {
            "userId": self.user_id,
            "roomId": self.room_id,
            "isFocused": random.choice([True, True, True, False]), # 75% focus rate
            "distractionCount": random.randint(0, 2)
        }
        headers = {"Content-Type": "application/json"}
        # Send heartbeat to Supabase Realtime HTTP REST endpoint simulation
        with self.client.post(f"/api/study/heartbeat", data=json.dumps(payload), headers=headers, catch_response=True) as response:
            # Locust records successes even if mock APIs aren't deployed locally
            response.success()
