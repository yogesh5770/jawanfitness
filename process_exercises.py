import json
import os

with open('src/data/raw_exercises.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

def map_category(cat, target):
    cat = cat.lower() if cat else ''
    target = target.lower() if target else ''
    if 'chest' in cat or 'pectoral' in target:
        return 'Chest'
    if 'back' in cat or 'lat' in target or 'spine' in target or 'trap' in target:
        return 'Back'
    if 'shoulder' in cat or 'delt' in target:
        return 'Shoulders'
    if 'waist' in cat or 'abs' in target:
        return 'Abs'
    if 'glute' in target:
        return 'Glutes'
    if 'upper leg' in cat or 'lower leg' in cat or 'quad' in target or 'hamstring' in target or 'calve' in target:
        return 'Legs'
    if 'upper arm' in cat:
        if 'bicep' in target:
            return 'Biceps'
        if 'tricep' in target:
            return 'Triceps'
        return 'Arms'
    if 'lower arm' in cat or 'forearm' in target:
        return 'Arms'
    if 'cardio' in cat or 'cardio' in target:
        return 'Cardio'
    return 'Full Body'

def infer_difficulty(equipment, name):
    eq = (equipment or '').lower()
    nm = (name or '').lower()
    if 'barbell' in eq or ('assisted' not in nm and ('pull-up' in nm or 'dip' in nm or 'deadlift' in nm or 'clean' in nm)):
        return 'Advanced'
    if 'dumbbell' in eq or 'cable' in eq or 'band' in eq:
        return 'Intermediate'
    return 'Beginner'

def get_breathing_cue(cat):
    c = cat.lower()
    if 'chest' in c or 'push' in c or 'shoulder' in c or 'tricep' in c:
        return {'eccentric': 'Inhale slowly as you lower the weight', 'concentric': 'Exhale forcefully as you press upward'}
    if 'back' in c or 'pull' in c or 'bicep' in c:
        return {'eccentric': 'Inhale as your arms extend', 'concentric': 'Exhale as you pull with your lats and arms'}
    if 'leg' in c or 'squat' in c:
        return {'eccentric': 'Deep belly inhale and brace core on descent', 'concentric': 'Exhale powerfully driving through heels'}
    if 'abs' in c:
        return {'eccentric': 'Inhale as you lower', 'concentric': 'Exhale and squeeze abdomen at top'}
    return {'eccentric': 'Inhale on the eccentric phase', 'concentric': 'Exhale during peak exertion'}

def get_trainer_tip(ex):
    name = ex.get('name', '').lower()
    if 'bench press' in name or 'press' in name:
        return 'Keep shoulder blades retracted, wrists straight over elbows, and avoid flaring past 75 degrees.'
    if 'squat' in name:
        return 'Drive knees out in line with toes, keep chest tall, and push the floor away through mid-foot.'
    if 'deadlift' in name:
        return 'Keep the bar glued to your shins, lock your lats tight, and push the earth away without spinal flexion.'
    if 'curl' in name:
        return 'Pin your elbows firmly to your ribcage and avoid hip swinging for strict bicep isolation.'
    if 'push' in name:
        return 'Maintain a rigid core plank line from head to heels throughout the entire range of motion.'
    return 'Focus on a controlled 2-second negative phase for maximum hypertrophy and joint longevity.'

def get_common_mistakes(ex):
    name = ex.get('name', '').lower()
    if 'press' in name:
        return ['Flaring elbows out to 90 degrees', 'Bouncing weights off chest', 'Arching lower back excessively']
    if 'squat' in name:
        return ['Knees caving inward (valgus collapse)', 'Heels lifting off ground', 'Rounding upper back']
    if 'deadlift' in name:
        return ['Rounding lumbar spine', 'Jerking the bar off the floor', 'Hyperextending lower back at lockout']
    if 'curl' in name:
        return ['Using momentum to swing the weight', 'Letting elbows drift forward', 'Incomplete lockout at bottom']
    return ['Rushing through the eccentric phase', 'Using excessive momentum', 'Compromising full range of motion']

clean_list = []
for ex in raw:
    cat = map_category(ex.get('category', ''), ex.get('target', ''))
    inst_en = ex.get('instruction_steps', {}).get('en', [])
    if not inst_en and 'instructions' in ex and isinstance(ex['instructions'], dict):
        text = ex['instructions'].get('en', '')
        inst_en = [s.strip() for s in text.split('.') if s.strip()]
    
    inst_hi = ex.get('instruction_steps', {}).get('hi', [])
    img_path = ex.get('image', '')
    gif_path = ex.get('gif_url', '')
    
    clean_ex = {
        'id': ex.get('id', ''),
        'name': ex.get('name', '').title(),
        'category': cat,
        'bodyPart': ex.get('body_part', '').title(),
        'primaryMuscle': ex.get('target', '').title(),
        'secondaryMuscles': [m.title() for m in ex.get('secondary_muscles', [])],
        'equipment': ex.get('equipment', '').title(),
        'difficulty': infer_difficulty(ex.get('equipment', ''), ex.get('name', '')),
        'thumbnailUrl': f'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/{img_path}',
        'animationUrl': f'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/{gif_path}',
        'instructions': inst_en if inst_en else ['Assume proper starting posture.', 'Execute movement with controlled tempo.', 'Return to start.'],
        'instructionsHi': inst_hi if inst_hi else [],
        'breathing': get_breathing_cue(cat),
        'commonMistakes': get_common_mistakes(ex),
        'trainerTip': get_trainer_tip(ex),
        'caloriesBurnedPerMin': 7
    }
    clean_list.append(clean_ex)

with open('src/data/allExercises.json', 'w', encoding='utf-8') as f:
    json.dump(clean_list, f, indent=2, ensure_ascii=False)

print(f'Done! Successfully generated {len(clean_list)} clean exercises in src/data/allExercises.json')
