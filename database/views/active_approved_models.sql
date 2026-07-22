-- View displaying approved and unarchived model listings
CREATE OR REPLACE VIEW public.active_approved_models AS
SELECT 
    id,
    name,
    gender,
    age,
    height,
    city,
    state,
    category,
    rating,
    "reviewsCount",
    "startingPrice"
FROM 
    public.models
WHERE 
    approved = TRUE 
    AND archived = FALSE;
