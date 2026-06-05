import json
import os
import time
from deep_translator import GoogleTranslator

# Path to translations
i18n_dir = os.path.join(os.path.dirname(__file__), '../i18n/translations')

langs = ['fr', 'de', 'it', 'pt', 'ru']

# Load ES as source
with open(os.path.join(i18n_dir, 'es.json'), 'r', encoding='utf-8') as f:
    es_data = json.load(f)

es_badges = es_data.get('achievements', {}).get('badges', {})
es_items = es_data.get('achievements', {}).get('items', {})

def translate_dict(source_dict, target_lang, keys_to_translate):
    translated_dict = {}
    translator = GoogleTranslator(source='es', target=target_lang)
    for key, val in source_dict.items():
        translated_dict[key] = {}
        for subkey, subval in val.items():
            if subkey in keys_to_translate and isinstance(subval, str):
                try:
                    translated_dict[key][subkey] = translator.translate(subval)
                except Exception as e:
                    print(f"Error translating {subval} to {target_lang}: {e}")
                    translated_dict[key][subkey] = subval
                time.sleep(0.1) # Be nice to Google
            else:
                translated_dict[key][subkey] = subval
    return translated_dict

for lang in langs:
    print(f"Translating for {lang}...")
    file_path = os.path.join(i18n_dir, f"{lang}.json")
    
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            lang_data = json.load(f)
            
        if 'achievements' not in lang_data:
            lang_data['achievements'] = {}
            
        print(f"  Translating badges to {lang}...")
        lang_data['achievements']['badges'] = translate_dict(es_badges, lang, ['label', 'description'])
        
        print(f"  Translating items to {lang}...")
        lang_data['achievements']['items'] = translate_dict(es_items, lang, ['title', 'description'])
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(lang_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {lang}.json")
        
print("All translations completed successfully!")
