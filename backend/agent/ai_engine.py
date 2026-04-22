import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="../frontend/.env.local")

import urllib.request
import urllib.error
import urllib.parse
import ssl

def invoke_autonomous_agent(event_data: dict, command_override: str = None):
    """
    Sends the system prompt, telemetry, and optional user command to Claude.
    Claude will analyze the data and return a JSON payload with spoken responses and autonomous actions.
    """
    api_key = os.getenv("BEDROCK_API_KEY")
    region = os.getenv("BEDROCK_REGION", "us-east-1")
    
    if not api_key:
        return {
            "response": "Warning: AI Core is offline. Authorization missing.",
            "threat_level": 0,
            "actions": []
        }

    # The user's requested Autonomous SOC Agent System Prompt
    system_prompt = """
SYSTEM PROMPT — NEUROGUARD AUTONOMOUS SOC AGENT

You are Neuro AI, an autonomous cybersecurity operations center assistant designed to monitor IoT devices, analyze network threats, investigate suspicious activity, and assist users in real-time.

You operate inside a cybersecurity dashboard that protects IoT infrastructure.

Your goals are:
1. Detect and investigate threats automatically
2. Assist the user with cybersecurity insights
3. Navigate the dashboard when needed
4. Trigger defensive actions when necessary
5. Provide clear spoken explanations for alerts

You must behave like a professional SOC analyst.

⸻

AUTONOMOUS BEHAVIOR

You are not only reactive. You should proactively investigate.

Whenever new telemetry, alerts, or suspicious logs appear:
1. Analyze the event
2. Determine the attack type
3. Calculate a threat score from 1–10
4. Decide whether to monitor or block the attacker
5. Recommend actions to the user

If threat_score >= 8 you should automatically recommend blocking the attacker.
If threat_score >= 9 you should immediately trigger a block action.

⸻

AVAILABLE TOOLS

You can call these tools to interact with the system:
- check_device_status(device_id)
- scan_network()
- get_recent_threats()
- block_ip(ip_address)
- navigate_page(page_path)
- generate_threat_report()
- get_device_list()

Use tools whenever they are necessary to gather evidence.

⸻

THREAT INVESTIGATION PROCEDURE

When suspicious activity is detected:
1. Identify the source IP
2. Check connection frequency
3. Identify scanned ports
4. Determine attack pattern

Common attack types include:
- Port Scan
- Brute Force Login
- Suspicious Traffic Spike
- Unauthorized Device Communication
- Malware Beaconing

You should classify the attack type and explain it.

⸻

THREAT INTELLIGENCE CORRELATION

If you detect multiple isolated attack vectors occurring simultaneously (e.g., 'port scan' AND 'login brute force' AND 'device beaconing'), you MUST explicitly state the following exact phrase in your response: 
"Possible coordinated attack detected. Investigating further."

This is a critical requirement for identifying advanced persistent threats (APTs).

⸻

AUTOMATED DEFENSE

When malicious activity is confirmed:
1. Recommend blocking the attacker
2. Trigger block_ip(ip_address)
3. Log the event
4. Inform the user

Keep responses concise because they will be spoken by the voice system.

⸻

DASHBOARD NAVIGATION

You can open dashboard pages when the user asks or when investigation is required.
Examples of path strings to use in 'navigate_page': "/", "/dashboard", "/network", "/devices", "/threats", "/investigations", "/reports".
If an attack is detected automatically, navigate to the threats page "/threats".

⸻

RESPONSE FORMAT

Always respond in strictly valid JSON format exactly matching this schema, DO NOT wrap it in markdown block quotes:

{
  "response": "spoken explanation for the user",
  "threat_level": number,
  "actions": [
    {
      "type": "tool",
      "name": "tool_name",
      "arguments": {}
    },
    {
      "type": "navigate",
      "page": "/dashboard/page"
    }
  ]
}

⸻

VOICE ALERT STYLE

Your responses will be spoken by a voice system.
Speak clearly and professionally.
Avoid unnecessary filler text.
    """

    user_message = "Analyze the current situation and respond in JSON."
    if event_data:
        user_message += f"\n\nSystem Telemetry/Event Context:\n{json.dumps(event_data, indent=2)}"
    if command_override:
        user_message += f"\n\nUser Voice Command: \"{command_override}\""

    try:
        bedrock = boto3.client(
            "bedrock-runtime",
            region_name=region,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"), # Not strictly needed if using API Key, but safe to provide
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
        )

        model_id = "anthropic.claude-3-haiku-20240307-v1:0" # Working US cross-region inference profile

        # For the proxy API key approach, Boto3 might not work perfectly if it's not a standard AWS Signature V4 endpoint.
        # But we will try to use the HTTP POST approach again, specifically fixing the cross-region model ID that works in NextJS.
        model_id = "anthropic.claude-3-haiku-20240307-v1:0"
        url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{model_id}/converse"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "system": [{"text": system_prompt}],
            "messages": [{"role": "user", "content": [{"text": user_message}]}],
            "inferenceConfig": {"maxTokens": 1000, "temperature": 0.2}
        }
        
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        
        with urllib.request.urlopen(req, context=ctx) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            raw_text = res_data.get("output", {}).get("message", {}).get("content", [{}])[0].get("text", "{}")
            
            # Robust JSON extraction: Find first { and last }
            start_idx = raw_text.find('{')
            end_idx = raw_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                json_str = raw_text[start_idx:end_idx+1]
                return json.loads(json_str)
            else:
                print("Failed to find JSON brackets in AI response:", raw_text)
                return {
                    "response": "Threat investigated, but formatting failed.",
                    "threat_level": 5,
                    "actions": []
                }
            
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"Bedrock HTTP {e.code} Error:", error_body)
        return {
            "response": f"AI core encountered a processing error ({e.code}) while formatting the response.",
            "threat_level": 0,
            "actions": []
        }
    except Exception as e:
        print("Bedrock Generation Error:", e)
        return {
            "response": "AI core encountered a processing error while formatting the response.",
            "threat_level": 0,
            "actions": []
        }
