# Red Flag Repository

Goals
- View & manage red flags for merchants

Red flags 
- multiple categories of red flags, each category will have both deterministic and probabilistic red flags
    1. Transaction Red Flags - transaction level inference - on transaction table
    2. Document Red Flags - document level inference - on document table
    3. Communication Red Flags - communication level inference - on communication table
    4. Network Red Flags - merchant level inference - features computed on the network table and added to the merchant table
    5. Legal & Regulatory Red Flags - merchant level inference - features computed on the Legal & Regulatory table and added to the merchant table
    6. Digital Footprint Red Flags - merchant level inference - features computed on the digital footprint table and added to the merchant table
- Deterministic red flags
    - Each deterministic red flag is a feature (original data columns or derived feature column) combined with a threshold
    - This threshold is set manually by the fraud team's manager    
    
- Probabilistic red flags (Anomaly detection model -> LLM explanation)
    - All probabilistic and an anomaly probability score.
    - 




