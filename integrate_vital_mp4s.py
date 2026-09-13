import json
import os

vital_json_path = r'C:\Users\yoges\Downloads\Vital Animations\VitalAnimations\Free50\50gymworkouts.json'
with open(vital_json_path, encoding='utf-8') as f:
    vital = json.load(f)

with open('src/data/allExercises.json', 'r', encoding='utf-8') as f:
    all_ex = json.load(f)

print(f'Total exercises before: {len(all_ex)}')

# Build 50 dedicated Vital Exercises with real 60fps HD MP4s
vital_exercises = []
for item in vital:
    id_code = item['id']
    name = item['name'].strip().title()
    category = 'Chest'
    target = 'Pectorals'
    
    nm = name.lower()
    if any(k in nm for k in ['squat', 'lunge', 'leg', 'calf', 'hamstring', 'quad']):
        category = 'Legs'
        target = 'Quadriceps / Glutes'
    elif any(k in nm for k in ['deadlift', 'back', 'row', 'lat', 'pull']):
        category = 'Back'
        target = 'Latissimus Dorsi / Erector Spinae'
    elif any(k in nm for k in ['press', 'fly', 'pec', 'chest', 'svend']):
        category = 'Chest'
        target = 'Pectoralis Major'
    elif any(k in nm for k in ['shoulder', 'delt', 'raise']):
        category = 'Shoulders'
        target = 'Deltoids'
    elif any(k in nm for k in ['bicep', 'curl']):
        category = 'Biceps'
        target = 'Biceps Brachii'
    elif any(k in nm for k in ['tricep', 'dip', 'pushdown']):
        category = 'Triceps'
        target = 'Triceps Brachii'
    elif any(k in nm for k in ['bike', 'sprint', 'run', 'cycling', 'cardio']):
        category = 'Cardio'
        target = 'Cardiovascular Endurance'
    elif any(k in nm for k in ['abs', 'plank', 'crunch']):
        category = 'Abs'
        target = 'Core / Abdominals'
    else:
        category = 'Full Body'
        target = 'Full Body Kinetic Chain'
    
    mp4_url = f'/vital-animations/{id_code}.mp4'
    
    # Try finding an image thumbnail from GymVisual dataset if similar, or use first frame
    thumb = f'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/images/0314-ns0SIbU.jpg'
    for ex in all_ex:
        if any(w in ex['name'].lower() for w in nm.split() if len(w) > 4):
            thumb = ex['thumbnailUrl']
            break

    v_ex = {
        'id': f'vital-{id_code}',
        'name': f'{name} (60 FPS 3D Video)',
        'category': category,
        'bodyPart': category,
        'primaryMuscle': target,
        'secondaryMuscles': ['Core Stabilizers', 'Synergist Fibers'],
        'equipment': 'Barbell / Machine / Dumbbell',
        'difficulty': 'Intermediate',
        'thumbnailUrl': thumb,
        'animationUrl': mp4_url,
        'instructions': [
            f'Set up for {name} with stable posture and braced core.',
            'Execute the repetition smoothly through the full active range of motion.',
            'Maintain continuous tension at peak contraction and return with a 2-second negative.'
        ],
        'instructionsHi': [
            f'{name} के लिए स्थिर मुद्रा और मजबूत कोर के साथ शुरुआत करें।',
            'पूरी गति के साथ पुनरावृत्ति को सुचारू रूप से निष्पादित करें।'
        ],
        'breathing': {
            'eccentric': 'Inhale deeply as you lower or reset',
            'concentric': 'Exhale powerfully during the drive phase'
        },
        'commonMistakes': [
            'Rushing through the negative eccentric phase',
            'Bouncing the weight at bottom reversal',
            'Losing core stability'
        ],
        'trainerTip': 'Watch the 60fps 3D video to observe the precise joint angles and scapular control.',
        'caloriesBurnedPerMin': 8,
        'isFullHdVideo': True
    }
    vital_exercises.append(v_ex)

# Combine: Put the 50 high-definition 60fps 3D videos FIRST in the database!
combined_exercises = vital_exercises + all_ex

with open('src/data/allExercises.json', 'w', encoding='utf-8') as f:
    json.dump(combined_exercises, f, indent=2, ensure_ascii=False)

print(f'Successfully updated src/data/allExercises.json! Total count: {len(combined_exercises)} exercises.')
print(f'Added {len(vital_exercises)} Full HD 60fps 3D videos at the top!')
