import os

# Define the root directory
root_dir = r"c:/Users/EL06/ms_project/ai-school-project-3/EasyStock_test/src"

# Define the replacements map
replacements = {
    # Tailwind Green (Old Brand) -> New Brand Blue
    'bg-green-50': 'bg-[#F5F8FC]',
    'bg-green-100': 'bg-[#CFE3FA]',
    'bg-green-500': 'bg-[#004FFE]',
    'bg-green-600': 'bg-[#004FFE]',
    'text-green-100': 'text-[#CFE3FA]',
    'text-green-500': 'text-[#004FFE]',
    'text-green-600': 'text-[#004FFE]',
    'border-green-100': 'border-[#CFE3FA]',
    'border-green-500': 'border-[#004FFE]',
    
    # Tailwind Red -> New Status Red
    'bg-red-500': 'bg-[#E53935]',
    'bg-red-400': 'bg-[#E53935]',
    'text-red-500': 'text-[#E53935]',
    'text-red-400': 'text-[#E53935]',
    'border-red-500': 'border-[#E53935]',
    
    # Tailwind Blue -> New Status Blue
    'bg-blue-500': 'bg-[#1E88E5]',
    'bg-blue-400': 'bg-[#1E88E5]',
    'text-blue-500': 'text-[#1E88E5]',
    'text-blue-400': 'text-[#1E88E5]',
    'border-blue-500': 'border-[#1E88E5]',
    'bg-blue-100': 'bg-[#E8F0FF]',
    'bg-blue-50': 'bg-[#E8F0FF]', # Status background mapping
    
    # Remaining Shades
    '#93c5fd': '#1E88E5', # blue-300
    '#fca5a5': '#E53935', # red-300
    'hover:bg-red-600': 'hover:bg-[#E53935]',
    'hover:bg-blue-600': 'hover:bg-[#1E88E5]',
    'text-green-800': 'text-[#004FFE]',
    'text-green-700': 'text-[#004FFE]', 
    'bg-green-200': 'bg-[#CFE3FA]',
    'green-600': '#004FFE', # Wildcard for other usages
    
    # Specific Residual Greens
    '#E8F3EF': '#F5F8FC', # Light mint bg -> Light blue bg
    '#40856C': '#004FFE', # Dark green gradient -> Brand Blue
    '#247054': '#051960', # Darker green -> Dark Blue
    '#CDE79D': '#E8F0FF', # Chart base (lime) -> Light Blue
    '#8DBA9C': '#1E88E5', # Chart text (sage) -> Status Blue
    '#68B297': '#3082F5', # Gradient green -> Secondary Blue
    'green-50': 'blue-50', # General tailwind fix
    'green-200': 'blue-200',
    'green-900': 'blue-900',
    'lime-100': 'blue-100', # Fix lime border
    'border-green-50': 'border-blue-50',
}

# Specific fix for chart colors in StockDetail.tsx if they are hardcoded
# '#3b82f6' -> '#1E88E5'
# '#ef4444' -> '#E53935'

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = content
        for old, new in replacements.items():
            new_content = new_content.replace(old, new)
            
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

for subdir, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css'):
            replace_in_file(os.path.join(subdir, file))
