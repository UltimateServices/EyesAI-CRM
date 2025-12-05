-- Update existing screenshot categories to eyes-content
UPDATE media_items
SET category = 'eyes-content'
WHERE category = 'screenshot';

-- Also update any internal_tags that reference 'screenshot'
UPDATE media_items
SET internal_tags = array_replace(internal_tags, 'screenshot', 'eyes-content')
WHERE 'screenshot' = ANY(internal_tags);
