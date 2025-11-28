-- Add attachments column to conversations table
-- This stores file metadata as JSON array

ALTER TABLE conversations 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN conversations.attachments IS 'Array of attachment metadata: [{filename, path, mimetype, size}]';

-- Create index for better query performance
CREATE INDEX idx_conversations_attachments ON conversations USING gin(attachments);
