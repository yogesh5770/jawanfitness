import json
import os

with open(r'C:\Users\yoges\Downloads\Vital Animations\VitalAnimations\Free50\50gymworkouts.json', encoding='utf-8') as f:
    vital_items = json.load(f)

# Existing staple exercises from user screenshot & gym staples
curated = [
  {
    "id": "30-degree-incline-dumbbell-bench-press",
    "name": "30-degree incline dumbbell bench press",
    "category": "Chest",
    "primaryMuscle": "Clavicular Head (Upper Chest)",
    "secondaryMuscles": ["Anterior Deltoid", "Triceps"],
    "equipment": "Dumbbell",
    "difficulty": "Intermediate",
    "animationUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0314-ns0SIbU.gif",
    "thumbnailUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0314-ns0SIbU.jpg",
    "trainerVideoUrl": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
    "instructions": [
      "Set bench to 30 degrees. Sit back with dumbbells resting on thighs.",
      "Kick weights to shoulder level and lie back with chest high.",
      "Press upward in a converging arc, squeezing upper pectorals at peak.",
      "Lower under control for 3 seconds feeling the deep stretch."
    ],
    "commonMistakes": [
      "Arching excessively so it mimics a flat bench",
      "Flaring elbows out past 60 degrees",
      "Bouncing weights"
    ],
    "trainerTip": "Lead with your chest and keep your forearms vertical throughout the movement.",
    "caloriesBurnedPerMin": 7
  },
  {
    "id": "30-degree-incline-dumbbell-fly",
    "name": "30-degree incline dumbbell fly",
    "category": "Chest",
    "primaryMuscle": "Upper Pectoralis Major",
    "secondaryMuscles": ["Anterior Deltoids", "Biceps Short Head"],
    "equipment": "Dumbbell",
    "difficulty": "Intermediate",
    "animationUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0319-ESOd5Pl.gif",
    "thumbnailUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0319-ESOd5Pl.jpg",
    "instructions": [
      "Lie back on a 30-degree incline bench with dumbbells extended above upper chest.",
      "Keep a slight 15-degree bend in your elbows fixed in place.",
      "Lower weights out wide in a slow arc until a full pectoral stretch is reached.",
      "Bring dumbbells back together as if hugging a wide barrel."
    ],
    "commonMistakes": [
      "Bending elbows into a press instead of maintaining fly radius",
      "Lowering past comfortable shoulder mobility limit"
    ],
    "trainerTip": "Squeeze your chest at the top without letting the dumbbells bang together.",
    "caloriesBurnedPerMin": 6
  },
  {
    "id": "45-degree-incline-dumbbell-bench-press",
    "name": "45-degree incline dumbbell bench press",
    "category": "Chest",
    "primaryMuscle": "Upper Chest & Front Delts",
    "secondaryMuscles": ["Triceps Brachii"],
    "equipment": "Dumbbell",
    "difficulty": "Intermediate",
    "animationUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0314-ns0SIbU.gif",
    "thumbnailUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0314-ns0SIbU.jpg",
    "instructions": [
      "Set bench to a steeper 45-degree angle.",
      "Press dumbbells overhead with tight abdominal brace.",
      "Lower weights to collarbone level with controlled tempo."
    ],
    "commonMistakes": ["Letting elbows flare wide", "Dropping weights fast"],
    "trainerTip": "Focus on clavicular pectoral contraction at the top.",
    "caloriesBurnedPerMin": 7
  },
  {
    "id": "45-degree-incline-dumbbell-fly",
    "name": "45-degree incline dumbbell fly",
    "category": "Chest",
    "primaryMuscle": "Clavicular Pectoralis",
    "secondaryMuscles": ["Anterior Deltoids"],
    "equipment": "Dumbbell",
    "difficulty": "Intermediate",
    "animationUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0319-ESOd5Pl.gif",
    "thumbnailUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0319-ESOd5Pl.jpg",
    "instructions": [
      "Perform on a 45-degree incline bench with controlled wide arc.",
      "Feel the intense stretch in the uppermost clavicular fibers.",
      "Bring weights together smoothly over face."
    ],
    "commonMistakes": ["Over-stretching shoulder capsule", "Excessive momentum"],
    "trainerTip": "Control the descent for 3 full seconds.",
    "caloriesBurnedPerMin": 6
  },
  {
    "id": "banded-bar-dips",
    "name": "Banded bar dips",
    "category": "Chest",
    "primaryMuscle": "Lower Pectoralis & Triceps",
    "secondaryMuscles": ["Anterior Deltoid", "Serratus Anterior"],
    "equipment": "Bodyweight",
    "difficulty": "Intermediate",
    "animationUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0251-9WTm7dq.gif",
    "thumbnailUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0251-9WTm7dq.jpg",
    "instructions": [
      "Loop resistance band across dip parallel bars and place knees on band.",
      "Lean torso forward 30 degrees to bias lower pectoral fibers.",
      "Lower until elbows reach 90 degrees.",
      "Press back up, locking out with chest forward."
    ],
    "commonMistakes": ["Staying completely upright", "Shrugging shoulders into ears"],
    "trainerTip": "Lean forward and keep elbows flared slightly out for maximum chest isolation.",
    "caloriesBurnedPerMin": 8
  },
  {
    "id": "barbell-bench-press",
    "name": "Barbell bench press",
    "category": "Chest",
    "primaryMuscle": "Pectoralis Major",
    "secondaryMuscles": ["Triceps", "Anterior Deltoid"],
    "equipment": "Barbell",
    "difficulty": "Intermediate",
    "animationUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif",
    "thumbnailUrl": "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0025-EIeI8Vf.jpg",
    "instructions": [
      "Lie flat on the bench with eyes directly underneath the racked barbell.",
      "Grip the bar slightly wider than shoulder-width with wrists stacked.",
      "Inhale, retract shoulder blades, lower bar to mid-chest, and press explosively."
    ],
    "commonMistakes": ["Bouncing bar off chest", "Flaring elbows to 90 degrees"],
    "trainerTip": "Drive your feet through the floor and keep wrists straight.",
    "caloriesBurnedPerMin": 8
  }
]

# Map Vital Animations exercises
for item in vital_items:
    id_code = item['id']
    name = item['name'].strip()
    body_part = item.get('bodyPart', '').lower()
    target = item.get('target', '').capitalize()
    eq = item.get('equipment', '').capitalize()
    
    # Category mapping
    if 'chest' in body_part:
        cat = 'Chest'
    elif 'back' in body_part:
        cat = 'Back'
    elif 'shoulder' in body_part:
        cat = 'Shoulders'
    elif 'upper arms' in body_part:
        if 'triceps' in name.lower():
            cat = 'Triceps'
        else:
            cat = 'Biceps'
    elif 'upper legs' in body_part or 'lower legs' in body_part:
        cat = 'Legs'
    elif 'cardio' in body_part:
        cat = 'Cardio'
    elif 'waist' in body_part:
        cat = 'Abs'
    else:
        cat = 'Legs' if 'squat' in name.lower() or 'leg' in name.lower() else 'Chest'

    # Equipment mapping
    if 'barbell' in eq.lower():
        equipment_type = 'Barbell'
    elif 'dumbbell' in eq.lower():
        equipment_type = 'Dumbbell'
    elif 'cable' in eq.lower():
        equipment_type = 'Cable'
    elif 'machine' in eq.lower() or 'stepmill' in eq.lower():
        equipment_type = 'Machine'
    elif 'kettlebell' in eq.lower():
        equipment_type = 'Kettlebell'
    else:
        equipment_type = 'Bodyweight'

    # Difficulty mapping
    diff = item.get('difficulty', 'Intermediate').capitalize()
    if diff not in ['Beginner', 'Intermediate', 'Advanced']:
        diff = 'Intermediate'

    curated.append({
        "id": f"vital-{id_code}",
        "name": name,
        "category": cat,
        "primaryMuscle": target or cat,
        "secondaryMuscles": [m.capitalize() for m in item.get('secondaryMuscles', [])],
        "equipment": equipment_type,
        "difficulty": diff,
        "animationUrl": f"/vital-animations/{id_code}.mp4",
        "thumbnailUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
        "instructions": item.get('instructions', []),
        "commonMistakes": [
            "Losing core tightness and lower back neutrality",
            "Rushing through the eccentric (lowering) phase",
            "Incomplete range of motion"
        ],
        "trainerTip": item.get('description', 'Keep movement controlled and maintain constant muscle tension.'),
        "caloriesBurnedPerMin": 8 if cat in ['Legs', 'Cardio'] else 6
    })

# Write output file
ts_content = "import { Exercise } from '../types';\n\nexport const EXERCISE_DATABASE: Exercise[] = " + json.dumps(curated, indent=2) + ";\n"

with open(r'C:\Users\yoges\.gemini\antigravity-ide\scratch\jawan-fitness-app\src\data\exercises.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Successfully generated exercises.ts with {len(curated)} total exercises!")
