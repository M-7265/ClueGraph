"""
seed.py — Hardcoded mysteries for ClueGraph.

Defines multiple mysteries, their case files, and their simulation steps.
"""

MYSTERIES = {
    "diamond": {
        "id": "diamond",
        "title": "The Diamond Theft",
        "description": "A rare diamond is stolen. Track down the culprit using testimonies and records.",
        "query": "Who stole the diamond?",
        "documents": [
            {
                "id": "doc_police_report",
                "title": "Police Report",
                "content": "A rare diamond was stolen from the vault at 10:00 PM. The vault lock was bypassed using a custom magnetic tool.",
                "category": "Evidence",
            },
            {
                "id": "doc_butler_interview",
                "title": "Suspect Interview — The Butler",
                "content": "I was nowhere near the vault. I was driving my car, license plate XYZ-789, on the highway at 10:15 PM.",
                "category": "Testimony",
            },
            {
                "id": "doc_toll_booth",
                "title": "Toll Booth Log",
                "content": "License plate XYZ-789 passed the Northbound toll at 10:20 PM.",
                "category": "Records",
            },
            {
                "id": "doc_diner_receipt",
                "title": "Diner Receipt",
                "content": "A coffee was purchased at the Northbound Diner at 10:30 PM. The receipt has magnetic tool residue on it.",
                "category": "Physical Evidence",
            },
        ],
        "sim_steps": [
            {
                "step": 1,
                "type": "retrieve",
                "query": "Who stole the diamond?",
                "document_id": "doc_police_report",
                "reasoning": "The police report confirms a diamond theft at 10:00 PM using a magnetic tool — but it names no suspect. I need to find who had access or who possessed such a tool.",
                "next_query": "suspect alibi magnetic tool",
            },
            {
                "step": 2,
                "type": "retrieve",
                "query": "suspect alibi magnetic tool",
                "document_id": "doc_butler_interview",
                "reasoning": "The Butler claims an alibi: driving license plate XYZ-789 at 10:15 PM. This alibi can be verified — or disproven — against traffic records. I need to check if plate XYZ-789 was actually on the highway at that time.",
                "next_query": "license plate XYZ-789 highway toll record",
            },
            {
                "step": 3,
                "type": "retrieve",
                "query": "license plate XYZ-789 highway toll record",
                "document_id": "doc_toll_booth",
                "reasoning": "The toll log places XYZ-789 at the Northbound toll at 10:20 PM — 20 minutes after the theft. The Butler said he was on the highway at 10:15. But wait: if he was heading *north* 20 minutes after the theft, let's check what is at that location.",
                "next_query": "Northbound diner magnetic tool receipt evidence",
            },
            {
                "step": 4,
                "type": "verdict",
                "query": "Northbound diner magnetic tool receipt evidence",
                "document_id": "doc_diner_receipt",
                "reasoning": "The Diner Receipt is the smoking gun. Magnetic tool residue was found on a receipt from the Northbound Diner at 10:30 PM — the same location the Butler's car was heading. The alibi is false: he drove north after the theft, stopped at the diner, and left evidence of the magnetic tool he used to bypass the vault.",
                "next_query": None,
                "answer": "🔍 VERDICT: The Butler stole the diamond. His alibi is disproven by the toll log (XYZ-789 heading north AFTER the theft) and destroyed by the diner receipt bearing magnetic tool residue — the same tool used to bypass the vault.",
            },
        ]
    },
    "cyber": {
        "id": "cyber",
        "title": "The Cyber Breach",
        "description": "Customer data was leaked from the internal server. Find the insider threat.",
        "query": "Who leaked the customer data?",
        "documents": [
            {
                "id": "doc_server_log",
                "title": "Database Server Log",
                "content": "Massive data export detected from IP 192.168.1.55 at 02:15 AM on Sunday.",
                "category": "Records",
            },
            {
                "id": "doc_network_map",
                "title": "Network Topology",
                "content": "IP 192.168.1.55 is assigned to the workstation in Office 4B, normally used by Alice.",
                "category": "Evidence",
            },
            {
                "id": "doc_badge_swipe",
                "title": "Security Badge Logs",
                "content": "Alice's badge was used to enter the building at 08:00 AM on Monday. Bob's badge was used to enter at 01:30 AM on Sunday and leave at 03:00 AM.",
                "category": "Records",
            },
            {
                "id": "doc_chat_log",
                "title": "IT Helpdesk Ticket",
                "content": "Ticket submitted by Bob on Friday: 'Requested temporary access to Office 4B to fix network cabling over the weekend.'",
                "category": "Testimony",
            },
        ],
        "sim_steps": [
            {
                "step": 1,
                "type": "retrieve",
                "query": "Who leaked the customer data?",
                "document_id": "doc_server_log",
                "reasoning": "The server logs show a data export from IP 192.168.1.55 at 02:15 AM on Sunday. I need to find out who was using that IP address.",
                "next_query": "IP 192.168.1.55 owner assignment",
            },
            {
                "step": 2,
                "type": "retrieve",
                "query": "IP 192.168.1.55 owner assignment",
                "document_id": "doc_network_map",
                "reasoning": "The IP belongs to Alice's workstation in Office 4B. However, the export happened at 02:15 AM on a Sunday. I should check if Alice was actually in the building at that time.",
                "next_query": "Alice Office 4B building access Sunday 02:15 AM",
            },
            {
                "step": 3,
                "type": "retrieve",
                "query": "Alice Office 4B building access Sunday 02:15 AM",
                "document_id": "doc_badge_swipe",
                "reasoning": "Alice did not enter the building on Sunday. Bob, however, entered at 01:30 AM and left at 03:00 AM on Sunday, which covers the time of the breach (02:15 AM). I need to see if Bob had access to Alice's office (4B).",
                "next_query": "Bob access Office 4B",
            },
            {
                "step": 4,
                "type": "verdict",
                "query": "Bob access Office 4B",
                "document_id": "doc_chat_log",
                "reasoning": "Bob requested access to Office 4B over the weekend under the guise of fixing network cabling. He was in the building at the time of the breach and had access to the workstation linked to the data export.",
                "next_query": None,
                "answer": "🔍 VERDICT: Bob leaked the data. He used a fake IT ticket to gain access to Alice's office (Office 4B) over the weekend, entered the building at 01:30 AM on Sunday, and executed the data export from her workstation (IP 192.168.1.55) at 02:15 AM to frame her.",
            }
        ]
    }
}

def seed_database(collection) -> None:
    """Populate a ChromaDB collection with all mysteries."""
    for mystery in MYSTERIES.values():
        collection.upsert(
            ids=[doc["id"] for doc in mystery["documents"]],
            documents=[doc["content"] for doc in mystery["documents"]],
            metadatas=[
                {
                    "title": doc["title"],
                    "category": doc["category"],
                    "mystery_id": mystery["id"]
                }
                for doc in mystery["documents"]
            ],
        )
