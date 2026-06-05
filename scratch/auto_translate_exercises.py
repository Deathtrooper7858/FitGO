import json
import os
import time
from deep_translator import GoogleTranslator

i18n_dir = os.path.join(os.path.dirname(__file__), '../i18n/translations')
langs = ['fr', 'de', 'it', 'pt', 'ru']

# Load ES as source
with open(os.path.join(i18n_dir, 'es.json'), 'r', encoding='utf-8') as f:
    es_data = json.load(f)

es_exercises = es_data.get('exerciseNames', {})

def translate_dict_batch(source_dict, target_lang):
    keys = list(source_dict.keys())
    values = list(source_dict.values())
    
    translated_dict = {}
    translator = GoogleTranslator(source='es', target=target_lang)
    
    # Process in batches of 50 to avoid limits
    batch_size = 50
    print(f"  Translating {len(values)} items in batches of {batch_size}...")
    
    for i in range(0, len(values), batch_size):
        batch_keys = keys[i:i+batch_size]
        batch_values = values[i:i+batch_size]
        
        try:
            translated_values = translator.translate_batch(batch_values)
            for k, v in zip(batch_keys, translated_values):
                translated_dict[k] = v
        except Exception as e:
            print(f"Error translating batch {i}: {e}")
            # Fallback to source
            for k, v in zip(batch_keys, batch_values):
                translated_dict[k] = v
        
        time.sleep(1) # Be nice to Google
        
    return translated_dict

for lang in langs:
    print(f"Translating exercises for {lang}...")
    file_path = os.path.join(i18n_dir, f"{lang}.json")
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            lang_data = json.load(f)
            
        lang_data['exerciseNames'] = translate_dict_batch(es_exercises, lang)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(lang_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {lang}.json")
        
print("All exercise translations completed successfully!")
