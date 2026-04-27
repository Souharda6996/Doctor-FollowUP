import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

from app.database import supabase
from app.services.vector_service import vector_service

REMEDIES = [
    {"name": "Aconitum Napellus", "common_name": "Monkshood", "symptoms": "Sudden fever, dry cold wind exposure, anxiety, restlessness", "description": "For first stage of acute illness."},
    {"name": "Arnica Montana", "common_name": "Leopard's Bane", "symptoms": "Bruising, soreness, physical trauma, shock, muscle ache", "description": "The primary remedy for injury."},
    {"name": "Belladonna", "common_name": "Deadly Nightshade", "symptoms": "Sudden high fever, throbbing headache, dilated pupils, sensitivity to light", "description": "Great for inflammation and redness."},
    {"name": "Bryonia Alba", "common_name": "Wild Hops", "symptoms": "Pain worse by movement, dry cough, extreme thirst, irritability", "description": "The 'moving hurts' remedy."},
    {"name": "Apis Mellifica", "common_name": "Honey Bee", "symptoms": "Stinging pain, swelling, hives, better by cold applications", "description": "Used for allergic reactions and edema."},
    {"name": "Arsenicum Album", "common_name": "Arsenic Trioxide", "symptoms": "Anxiety, restlessness, burning pains relieved by heat, food poisoning", "description": "For digestive distress and deep anxiety."},
    {"name": "Gelsemium", "common_name": "Yellow Jasmine", "symptoms": "Aching, tiredness, heaviness, stage fright, flu-like symptoms", "description": "The 'dull, dazed, and drowsy' remedy."},
    {"name": "Nux Vomica", "common_name": "Poison Nut", "symptoms": "Indigestion, overindulgence, irritability, constipation, morning after effect", "description": "For high-stress, stimulant-heavy lifestyles."},
    {"name": "Pulsatilla", "common_name": "Wind Flower", "symptoms": "Changeable symptoms, weeping, better by open air, thick yellow discharge", "description": "A major remedy for children and emotional sensitivity."},
    {"name": "Rhus Toxicodendron", "common_name": "Poison Ivy", "symptoms": "Rusty gate symptoms, joint pain better by continued motion, restlessness at night", "description": "For sprains, strains and joint pain."},
    {"name": "Sulphur", "common_name": "Brimstone", "symptoms": "Skin eruptions, itching, burning, dislike of water, morning diarrhea", "description": "The king of skin remedies."},
    {"name": "Ignatia Amara", "common_name": "St. Ignatius Bean", "symptoms": "Grief, emotional shock, sighing, contradictory symptoms", "description": "For acute grief and emotional trauma."},
    {"name": "Magnesia Phosphorica", "common_name": "Phosphate of Magnesia", "symptoms": "Cramping pains, better with heat and pressure, menstrual cramps", "description": "The homeopathic 'aspirin' for cramps."},
    {"name": "Lycopodium", "common_name": "Club Moss", "symptoms": "Bloating, gas, right-sided symptoms, lack of self-confidence", "description": "For liver and digestive issues."},
    {"name": "Ferrum Phosphoricum", "common_name": "Phosphate of Iron", "symptoms": "Early stage fever, low-grade inflammation, anemic tendency", "description": "Gentle first-aid for fevers."},
    {"name": "Cantharis", "common_name": "Spanish Fly", "symptoms": "Burning pain, urinary tract infections, severe burns or scalds", "description": "Specific for burning and stinging sensations."},
    {"name": "Carbo Vegetabilis", "common_name": "Vegetable Charcoal", "symptoms": "Exhaustion, need for air, extreme bloating and gas", "description": "The 'corpse reviver' for deep depletion."},
    {"name": "Chamomile", "common_name": "German Chamomile", "symptoms": "Extreme sensitivity to pain, irritability, one cheek red, colic", "description": "Primarily for teething infants and irritability."},
    {"name": "Calcarea Carbonica", "common_name": "Calcium Carbonate", "symptoms": "Slow development, cold hands and feet, easily fatigued, sweaty head", "description": "For metabolic and structural support."},
    {"name": "Natrum Muriaticum", "common_name": "Table Salt", "symptoms": "Suppressed grief, watery cold, craving for salt, headache like hammers", "description": "Deep chronic remedy for emotional reservation."},
]

async def seed():
    print(f"🌱 Starting Seed process for {len(REMEDIES)} remedies...")
    
    # Optional: Clear existing remedies (Uncomment if needed)
    # supabase.table("remedies").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()

    for r in REMEDIES:
        print(f"✨ Processing {r['name']}...")
        
        # Combine symptoms and description for a richer embedding
        search_text = f"{r['name']} {r['symptoms']} {r['description']}"
        embedding = vector_service.generate_embedding(search_text)
        
        data = {
            "name": r["name"],
            "common_name": r["common_name"],
            "symptoms_treated": r["symptoms"].split(", "),
            "description": r["description"],
            "embedding": embedding,
            "potency": "30C" # Default potency
        }
        
        try:
            supabase.table("remedies").insert(data).execute()
        except Exception as e:
            print(f"❌ Error inserting {r['name']}: {str(e)}")

    print("✅ Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed())
