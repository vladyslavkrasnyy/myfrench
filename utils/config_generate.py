import os
import json
from collections import OrderedDict

def get_json_files(directory):
    """Get list of all JSON files from directory (excluding config.json)"""
    return [f.replace('.json', '') for f in os.listdir(directory)
            if f.endswith('.json') and f != 'config.json']

def group_verbs(topics):
    """Group verb files together, matching base and imperfect forms"""
    verb_groups = {}
    non_verb_topics = []

    # Common French verbs to prioritize
    common_verbs = [
        'etre', 'avoir', 'aller', 'faire', 'dire', 'pouvoir',
        'vouloir', 'voir', 'savoir', 'venir', 'devoir', 'parler',
        'finir', 'mettre', 'prendre'
    ]

    # First add common verbs in specific order
    for verb in common_verbs:
        if verb in topics or f"{verb}-imparfe" in topics:
            verb_groups[verb] = []
            if verb in topics:
                verb_groups[verb].append(verb)
            if f"{verb}-imparfe" in topics:
                verb_groups[verb].append(f"{verb}-imparfe")

    # Then add any other verb-like files
    for topic in topics:
        if topic.endswith('-imparfe') or topic in common_verbs:
            base_verb = topic.replace('-imparfe', '')
            if base_verb not in verb_groups:
                verb_groups[base_verb] = []
            if topic not in verb_groups[base_verb]:
                verb_groups[base_verb].append(topic)
        else:
            non_verb_topics.append(topic)

    # Flatten verb groups in order
    ordered_verbs = []
    for verb in common_verbs:  # Use common_verbs order
        if verb in verb_groups:
            ordered_verbs.extend(sorted(verb_groups[verb]))

    return ordered_verbs, non_verb_topics

def group_by_category(topics):
    """Group remaining topics by category"""
    categories = OrderedDict([
        ('activities', ['daily-activities', 'work-tasks', 'hobbies', 'gardening']),
        ('colors', ['basic-colors', 'advanced-colors']),
        ('clothing', ['basic-clothing', 'clothing', 'clothing-accessories', 'seasonal-clothing', 'shoes']),
        ('home', ['home-items', 'household-items', 'household-maintenance', 'home-improvement',
                  'furniture', 'rooms', 'bathroom-items', 'kitchen-appliances', 'storage-solutions',
                  'lighting', 'windows-doors', 'flooring', 'heating-cooling', 'exterior-features', 'decor']),
        ('food', ['food', 'fruits-vegetables', 'dairy-products', 'meat-fish', 'beverages']),
        ('cleaning', ['cleaning-supplies', 'cleaning-appliances', 'waste-management']),
        ('people', ['family-members', 'extended-family', 'relationships', 'age-groups', 'body-parts']),
        ('places', ['places', 'public-buildings', 'city-locations', 'shops-stores']),
        ('animals', ['domestic-animals', 'wild-animals', 'forest-animals']),
        ('numbers', ['numbers', 'large-numbers']),
        ('other', ['technology', 'transportation', 'safety-equipment', 'security', 'personal-items'])
    ])

    ordered_topics = []
    used_topics = set()

    # Add topics in category order
    for category_topics in categories.values():
        matching_topics = [t for t in topics if t in category_topics]
        ordered_topics.extend(sorted(matching_topics))
        used_topics.update(matching_topics)

    # Add any remaining topics
    remaining = [t for t in topics if t not in used_topics]
    ordered_topics.extend(sorted(remaining))

    return ordered_topics

def build_config(directory):
    available_topics = get_json_files(directory)

    # First group verbs
    verb_topics, other_topics = group_verbs(available_topics)

    # Then group remaining topics by category
    categorized_topics = group_by_category(other_topics)

    # Create config with ordered topics
    config = OrderedDict()
    config["topics"] = OrderedDict()

    # Add all topics in order
    for topic in (verb_topics + categorized_topics):
        config["topics"][topic] = f"{topic}.json"

    return config

def generate_config(directory):
    config = build_config(directory)

    config_path = os.path.join(directory, 'config.json')
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

if __name__ == "__main__":
    vocabulary_dir = '/vocabulary'
    generate_config(vocabulary_dir)