"""
Medical Reference Database (RAG Knowledge Base)

Local list of common lab tests with WHO/standard age-and-sex-adjusted
reference ranges. Used as the retrieval source for the RAG pipeline.
"""

MEDICAL_REFERENCE_DB = [
    # PANEL 1 — Full Blood Count (CBC)
    {
        "id": "hemoglobin",
        "name": "Hemoglobin",
        "aliases": ["HGB", "Hb", "Haemoglobin", "HB"],
        "panel": "CBC",
        "content": "Hemoglobin is an oxygen-carrying protein in red blood cells. High levels may indicate polycythemia or dehydration. Low levels indicate anemia, bleeding, or nutritional deficiencies.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 13.5, "max": 17.5, "unit": "g/dL"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 12.0, "max": 15.5, "unit": "g/dL"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 11.0, "max": 16.0, "unit": "g/dL"}
        ],
        "criticalLow": 7.0,
        "criticalHigh": 20.0
    },
    {
        "id": "wbc",
        "name": "WBC",
        "aliases": ["TLC", "Total Leucocyte Count", "Total WBC", "White Blood Cells", "Leukocytes", "Total White Blood Cell Count"],
        "panel": "CBC",
        "content": "White blood cells fight infections. High WBC (leukocytosis) indicates infection, inflammation, or leukemia. Low WBC (leukopenia) indicates immune suppression or bone marrow issues.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 4.5, "max": 11.0, "unit": "x10³/µL"}
        ],
        "criticalLow": 2.0,
        "criticalHigh": 30.0
    },
    {
        "id": "rbc",
        "name": "RBC",
        "aliases": ["Red Blood Cells", "Erythrocytes", "Red Blood Cell Count", "Red Cell Count"],
        "panel": "CBC",
        "content": "RBCs transport oxygen from the lungs to the body. High RBC count may indicate dehydration or heart disease. Low RBC count is a primary indicator of various types of anemia.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 4.5, "max": 5.9, "unit": "x10⁶/µL"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 4.1, "max": 5.1, "unit": "x10⁶/µL"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 3.8, "max": 5.5, "unit": "x10⁶/µL"}
        ],
        "criticalLow": 2.0,
        "criticalHigh": 7.0
    },
    {
        "id": "platelets",
        "name": "Platelets",
        "aliases": ["PLT", "Platelet Count", "Thrombocytes", "Platelet", "Plt Count"],
        "panel": "CBC",
        "content": "Platelets play a crucial role in blood clotting. Extremely low levels are seen in dengue fever and carry a high bleeding risk. High levels can lead to abnormal blood clots.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 150, "max": 400, "unit": "x10³/µL"}
        ],
        "criticalLow": 50,
        "criticalHigh": 1000
    },
    {
        "id": "hematocrit",
        "name": "Hematocrit",
        "aliases": ["HCT", "PCV", "Packed Cell Volume", "Haematocrit", "Packed Cell Vol"],
        "panel": "CBC",
        "content": "Hematocrit is the percentage of red blood cells in the blood volume. Low levels indicate anemia or blood loss. High levels can be a sign of dehydration or lung/heart disease.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 41, "max": 53, "unit": "%"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 36, "max": 46, "unit": "%"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 33, "max": 45, "unit": "%"}
        ],
        "criticalLow": 20,
        "criticalHigh": 60
    },
    {
        "id": "mcv",
        "name": "MCV",
        "aliases": ["Mean Corpuscular Volume", "Mean Cell Volume"],
        "panel": "CBC",
        "content": "MCV measures the average size of red blood cells. Low MCV indicates microcytic anemia, often from iron deficiency. High MCV indicates macrocytic anemia, often from B12 or folate deficiency.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 80, "max": 100, "unit": "fL"}
        ]
    },
    {
        "id": "mch",
        "name": "MCH",
        "aliases": ["Mean Corpuscular Hemoglobin", "Mean Cell Hemoglobin"],
        "panel": "CBC",
        "content": "MCH calculates the average amount of hemoglobin per red blood cell. High MCH implies macrocytic anemia. Low MCH implies microcytic hypochromic anemia, typical of iron deficiency.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 27, "max": 33, "unit": "pg"}
        ]
    },
    {
        "id": "mchc",
        "name": "MCHC",
        "aliases": ["Mean Corpuscular Hemoglobin Concentration", "Mean Cell Hemoglobin Concentration"],
        "panel": "CBC",
        "content": "MCHC is the hemoglobin concentration in a given volume of red blood cells. High MCHC can indicate spherocytosis. Low MCHC means cells are hypochromic, seen in iron deficiency.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 32, "max": 36, "unit": "g/dL"}
        ]
    },
    {
        "id": "rdw",
        "name": "RDW",
        "aliases": ["Red Cell Distribution Width", "RDW-CV", "RDW-SD", "Red Blood Cell Distribution Width"],
        "panel": "CBC",
        "content": "RDW measures the variation in red blood cell size. A high RDW means cells are of unequal sizes (anisocytosis), which is common in mixed anemias or early nutritional deficiency.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 11.5, "max": 14.5, "unit": "%"}
        ]
    },
    {
        "id": "mpv",
        "name": "MPV",
        "aliases": ["Mean Platelet Volume"],
        "panel": "CBC",
        "content": "MPV measures the average size of platelets. A high MPV indicates active platelet production, often due to destruction. A low MPV suggests poor platelet production in the bone marrow.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 7.5, "max": 12.5, "unit": "fL"}
        ]
    },
    {
        "id": "neutrophils",
        "name": "Neutrophils",
        "aliases": ["Neutrophil", "Neut", "Neutrophils %", "Seg", "Segmented Neutrophils", "PMN", "Poly"],
        "panel": "CBC - DLC",
        "content": "Neutrophils are the first line of defense against bacterial infections. High levels indicate an acute bacterial infection or severe stress. Low levels increase the risk of infections.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 40, "max": 75, "unit": "%"}
        ],
        "criticalLow": 20,
        "criticalHigh": 85
    },
    {
        "id": "lymphocytes",
        "name": "Lymphocytes",
        "aliases": ["Lymphocyte", "Lymph", "Lymphocytes %", "Lymphs"],
        "panel": "CBC - DLC",
        "content": "Lymphocytes produce antibodies and respond to viral infections. High levels are seen in viral illnesses like flu or hepatitis. Low levels can indicate immune system suppression.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 20, "max": 45, "unit": "%"}
        ],
        "criticalLow": 10,
        "criticalHigh": 60
    },
    {
        "id": "monocytes",
        "name": "Monocytes",
        "aliases": ["Monocyte", "Mono", "Monocytes %"],
        "panel": "CBC - DLC",
        "content": "Monocytes are macrophages that clear up dead cells and debris. High levels indicate chronic infections like tuberculosis, or recovery from an acute infection phase.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 2, "max": 10, "unit": "%"}
        ],
        "criticalHigh": 20
    },
    {
        "id": "eosinophils",
        "name": "Eosinophils",
        "aliases": ["Eosinophil", "Eos", "Eosinophils %", "Eosino"],
        "panel": "CBC - DLC",
        "content": "Eosinophils respond to allergic reactions and parasitic infections. Hypereosinophilia is strongly linked to severe allergies, asthma, or parasitic worm infestations.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 1, "max": 6, "unit": "%"}
        ],
        "criticalHigh": 20
    },
    {
        "id": "basophils",
        "name": "Basophils",
        "aliases": ["Basophil", "Baso", "Basophils %"],
        "panel": "CBC - DLC",
        "content": "Basophils are the rarest WBCs and play a role in allergic responses and asthma by releasing histamine. Elevated basophils can be seen in chronic inflammation or leukemia.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 1, "unit": "%"}
        ],
        "criticalHigh": 3
    },

    # PANEL 2 — HbA1c
    {
        "id": "hba1c",
        "name": "HbA1c",
        "aliases": ["Glycated Hemoglobin", "A1C", "HbA1C", "Glycosylated Hemoglobin", "Hemoglobin A1c"],
        "panel": "HbA1c",
        "content": "HbA1c shows a 3-month average of blood sugar levels. It is used for diabetes diagnosis and monitoring. 5.7-6.4% indicates pre-diabetes. 6.5% or higher indicates clinical diabetes.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 5.6, "unit": "%"}
        ],
        "criticalHigh": 10.0
    },

    # PANEL 3 — Kidney Function Test (RFT)
    {
        "id": "creatinine",
        "name": "Creatinine",
        "aliases": ["Serum Creatinine", "S. Creatinine", "Creat", "S.Creatinine", "Creatinine Serum"],
        "panel": "RFT",
        "content": "Creatinine is a waste product of muscle metabolism. It serves as a reliable marker of kidney filtration efficiency. High levels indicate impaired kidney function or acute renal failure.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 0.74, "max": 1.35, "unit": "mg/dL"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 0.59, "max": 1.04, "unit": "mg/dL"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 0.3, "max": 1.0, "unit": "mg/dL"}
        ],
        "criticalHigh": 10.0
    },
    {
        "id": "urea",
        "name": "Urea",
        "aliases": ["Blood Urea", "Serum Urea", "BUN", "Blood Urea Nitrogen", "S. Urea"],
        "panel": "RFT",
        "content": "Urea is a waste product of protein breakdown. It indicates how well kidneys clear waste from the blood. Elevated urea suggests kidney stress, dehydration, or a high-protein diet.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 15, "max": 45, "unit": "mg/dL"}
        ],
        "criticalHigh": 100
    },
    {
        "id": "uric_acid",
        "name": "Uric Acid",
        "aliases": ["S. Uric Acid", "Serum Uric Acid", "SUA", "Uric Acid Serum"],
        "panel": "RFT",
        "content": "Uric acid is produced from purine metabolism. High levels can crystallize in joints causing gout, or form kidney stones. Persistently high uric acid is a risk factor for kidney damage.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 3.4, "max": 7.0, "unit": "mg/dL"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 2.4, "max": 6.0, "unit": "mg/dL"}
        ],
        "criticalHigh": 12.0
    },
    {
        "id": "sodium",
        "name": "Sodium",
        "aliases": ["Na", "Serum Sodium", "S. Sodium", "Na+"],
        "panel": "RFT",
        "content": "Sodium is an essential electrolyte regulating blood volume and fluid balance. Severe sodium imbalance (high or low) poses significant neurological risks and requires immediate medical correction.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 136, "max": 145, "unit": "mEq/L"}
        ],
        "criticalLow": 120,
        "criticalHigh": 160
    },
    {
        "id": "potassium",
        "name": "Potassium",
        "aliases": ["K", "Serum Potassium", "S. Potassium", "K+"],
        "panel": "RFT",
        "content": "Potassium controls nerve signals, heart rhythm, and muscle contraction. Both hypokalemia (low) and hyperkalemia (high) carry high risk for dangerous, life-threatening cardiac arrhythmias.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 3.5, "max": 5.1, "unit": "mEq/L"}
        ],
        "criticalLow": 2.5,
        "criticalHigh": 6.5
    },
    {
        "id": "chloride",
        "name": "Chloride",
        "aliases": ["Cl", "Serum Chloride", "S. Chloride", "Cl-"],
        "panel": "RFT",
        "content": "Chloride works with sodium and potassium to maintain cellular fluid balance and blood pH. Abnormal levels usually accompany shifts in sodium or bicarbonate due to vomiting or kidney issues.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 98, "max": 107, "unit": "mEq/L"}
        ],
        "criticalLow": 80,
        "criticalHigh": 115
    },
    {
        "id": "egfr",
        "name": "eGFR",
        "aliases": ["Estimated GFR", "Glomerular Filtration Rate", "Estimated Glomerular Filtration Rate", "GFR"],
        "panel": "RFT",
        "content": "eGFR measures how efficiently kidneys filter blood. It is the primary tool for staging Chronic Kidney Disease (CKD). 90+ is normal, 60-89 mild, 30-59 moderate, 15-29 severe, below 15 indicates failure.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 90, "max": 999, "unit": "mL/min/1.73m²"}
        ],
        "criticalLow": 15
    },

    # PANEL 4 — Lipid Profile
    {
        "id": "cholesterol",
        "name": "Total Cholesterol",
        "aliases": ["Cholesterol", "Serum Cholesterol", "TC", "Cholesterol Total", "Total Cholesterol Level"],
        "panel": "Lipid Profile",
        "content": "Total cholesterol measures all cholesterol types in the blood. Desirable is below 200 mg/dL. Borderline is 200-239. Values of 240+ indicate a significantly elevated risk for coronary heart disease.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 200, "unit": "mg/dL"}
        ],
        "criticalHigh": 300
    },
    {
        "id": "triglycerides",
        "name": "Triglycerides",
        "aliases": ["TG", "Trig", "Serum Triglycerides", "Triglyceride"],
        "panel": "Lipid Profile",
        "content": "Triglycerides are the most common body fat type, storing excess calories. Normal is below 150 mg/dL. Very high levels (500+) pose an acute risk for developing acute pancreatitis.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 150, "unit": "mg/dL"}
        ],
        "criticalHigh": 500
    },
    {
        "id": "hdl",
        "name": "HDL Cholesterol",
        "aliases": ["HDL", "Good Cholesterol", "HDL-C", "HDL Chol", "High Density Lipoprotein"],
        "panel": "Lipid Profile",
        "content": "HDL is known as 'good' cholesterol because it absorbs bad cholesterol and carries it back to the liver to be flushed. Higher HDL levels are protective against cardiovascular disease.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 40, "max": 999, "unit": "mg/dL"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 50, "max": 999, "unit": "mg/dL"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 45, "max": 999, "unit": "mg/dL"}
        ],
        "criticalLow": 25
    },
    {
        "id": "ldl",
        "name": "LDL Cholesterol",
        "aliases": ["LDL", "Bad Cholesterol", "LDL-C", "LDL Chol", "Low Density Lipoprotein"],
        "panel": "Lipid Profile",
        "content": "LDL is the 'bad' cholesterol that contributes to plaque buildup in the arteries. Optimal levels are below 100 mg/dL. Very high levels (190+) strongly increase heart attack and stroke risks.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 100, "unit": "mg/dL"}
        ],
        "criticalHigh": 190
    },
    {
        "id": "vldl",
        "name": "VLDL Cholesterol",
        "aliases": ["VLDL", "VLDL-C", "Very Low Density Lipoprotein", "VLDL Chol"],
        "panel": "Lipid Profile",
        "content": "VLDL primarily carries triglycerides rather than cholesterol through the bloodstream. Like LDL, elevated VLDL contributes to arterial plaque and is closely linked to high triglyceride levels.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 2, "max": 30, "unit": "mg/dL"}
        ],
        "criticalHigh": 40
    },

    # PANEL 5 — Liver Function Test (LFT)
    {
        "id": "alt",
        "name": "ALT",
        "aliases": ["SGPT", "Alanine Aminotransferase", "Alanine Transaminase", "GPT"],
        "panel": "LFT",
        "content": "ALT is an enzyme predominantly found in the liver. It is a highly sensitive marker for liver damage. Greatly elevated levels are key indicators of viral hepatitis, toxins, or fatty liver.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 7, "max": 56, "unit": "U/L"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 7, "max": 45, "unit": "U/L"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 7, "max": 45, "unit": "U/L"}
        ],
        "criticalHigh": 500
    },
    {
        "id": "ast",
        "name": "AST",
        "aliases": ["SGOT", "Aspartate Aminotransferase", "Aspartate Transaminase", "GOT"],
        "panel": "LFT",
        "content": "AST is an enzyme found in the liver, heart, and muscles. High AST alongside ALT confirms liver damage. If AST is high but ALT is normal, it may point to heart or muscle damage instead.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 10, "max": 40, "unit": "U/L"}
        ],
        "criticalHigh": 500
    },
    {
        "id": "alp",
        "name": "ALP",
        "aliases": ["Alkaline Phosphatase", "Alk Phos", "Alk. Phosphatase"],
        "panel": "LFT",
        "content": "ALP is found heavily in the liver, bile ducts, and bone. High levels indicate bile duct obstruction or active bone disorders. Children naturally have much higher ALP due to active bone growth.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 44, "max": 147, "unit": "U/L"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 100, "max": 400, "unit": "U/L"}
        ],
        "criticalHigh": 1000
    },
    {
        "id": "ggt",
        "name": "GGT",
        "aliases": ["Gamma GT", "Gamma-Glutamyl Transferase", "Gamma Glutamyl Transpeptidase", "GGTP"],
        "panel": "LFT",
        "content": "GGT is highly sensitive to alcohol consumption and bile duct problems. It is the most sensitive marker for alcoholic liver disease and helps distinguish liver vs. bone origin of elevated ALP.",
        "ranges": [
            {"sex": "male", "minAge": 18, "maxAge": 120, "min": 8, "max": 61, "unit": "U/L"},
            {"sex": "female", "minAge": 18, "maxAge": 120, "min": 5, "max": 36, "unit": "U/L"}
        ],
        "criticalHigh": 500
    },
    {
        "id": "bilirubin_total",
        "name": "Bilirubin Total",
        "aliases": ["Total Bilirubin", "T. Bilirubin", "Bili Total", "S. Bilirubin Total", "Serum Bilirubin", "Bilirubin"],
        "panel": "LFT",
        "content": "Bilirubin is a yellow pigment produced from the normal breakdown of red blood cells. Elevated total bilirubin leads to jaundice (yellowing of skin/eyes) and indicates liver or blood problems.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0.1, "max": 1.2, "unit": "mg/dL"}
        ],
        "criticalHigh": 15.0
    },
    {
        "id": "bilirubin_direct",
        "name": "Bilirubin Direct",
        "aliases": ["Direct Bilirubin", "D. Bilirubin", "Conjugated Bilirubin", "Bili Direct", "Direct Bili"],
        "panel": "LFT",
        "content": "Direct bilirubin is the liver-processed (conjugated) water-soluble form. High direct bilirubin specifically points to bile duct obstruction, gallstones, or liver inflammation preventing excretion.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0.0, "max": 0.3, "unit": "mg/dL"}
        ],
        "criticalHigh": 5.0
    },
    {
        "id": "bilirubin_indirect",
        "name": "Bilirubin Indirect",
        "aliases": ["Indirect Bilirubin", "I. Bilirubin", "Unconjugated Bilirubin", "Bili Indirect", "Indirect Bili"],
        "panel": "LFT",
        "content": "Indirect bilirubin is the pre-liver (unconjugated) fat-soluble form. Elevations are typically caused by rapid red blood cell breakdown (hemolysis) or a benign genetic condition called Gilbert's syndrome.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0.1, "max": 1.0, "unit": "mg/dL"}
        ],
        "criticalHigh": 12.0
    },
    {
        "id": "total_protein",
        "name": "Total Protein",
        "aliases": ["Serum Total Protein", "T. Protein", "Protein Total", "Total Proteins"],
        "panel": "LFT",
        "content": "Total protein measures both albumin and globulin in the blood. Abnormally low total protein indicates severe malnutrition, liver failure, or kidney conditions that leak protein into urine.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 6.0, "max": 8.3, "unit": "g/dL"}
        ],
        "criticalLow": 4.0
    },
    {
        "id": "albumin",
        "name": "Albumin",
        "aliases": ["Serum Albumin", "S. Albumin", "Alb"],
        "panel": "LFT",
        "content": "Albumin is the most abundant blood protein, produced exclusively by the liver. It regulates fluid balance. Low levels indicate chronic liver failure, malnutrition, or massive fluid leakage.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 3.5, "max": 5.0, "unit": "g/dL"}
        ],
        "criticalLow": 2.0
    },
    {
        "id": "globulin",
        "name": "Globulin",
        "aliases": ["Serum Globulin", "S. Globulin", "Glob"],
        "panel": "LFT",
        "content": "Globulins are a group of immune and transport proteins. High globulin levels frequently indicate chronic infections, autoimmune diseases, chronic inflammation, or multiple myeloma.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 2.0, "max": 3.5, "unit": "g/dL"}
        ]
    },

    # PANEL 6 — Thyroid Profile
    {
        "id": "tsh",
        "name": "TSH",
        "aliases": ["Thyroid Stimulating Hormone", "Thyrotropin", "S. TSH", "Serum TSH"],
        "panel": "Thyroid Profile",
        "content": "TSH is the master pituitary hormone controlling the thyroid. An inverse relationship exists: low TSH indicates an overactive thyroid (hyperthyroidism), while high TSH means an underactive thyroid (hypothyroidism).",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 0.4, "max": 4.0, "unit": "mIU/L"},
            {"sex": "any", "minAge": 0, "maxAge": 17, "min": 0.7, "max": 6.4, "unit": "mIU/L"}
        ],
        "criticalLow": 0.1,
        "criticalHigh": 10.0
    },
    {
        "id": "t3",
        "name": "T3",
        "aliases": ["Triiodothyronine", "Free T3", "FT3", "Total T3", "Serum T3", "T3 Total"],
        "panel": "Thyroid Profile",
        "content": "T3 is the active, potent form of thyroid hormone that regulates cellular metabolism. It is a critical marker for confirming hyperthyroidism or assessing the severity of hypothyroidism.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 2.3, "max": 4.2, "unit": "pg/mL"}
        ],
        "criticalLow": 1.5,
        "criticalHigh": 7.0
    },
    {
        "id": "t4",
        "name": "T4",
        "aliases": ["Thyroxine", "Free T4", "FT4", "Total T4", "Serum T4", "T4 Total"],
        "panel": "Thyroid Profile",
        "content": "T4 is the primary hormone produced directly by the thyroid gland. It gets converted to active T3 in body tissues. High T4 means hyperthyroidism; low T4 confirms primary hypothyroidism.",
        "ranges": [
            {"sex": "any", "minAge": 18, "maxAge": 120, "min": 0.8, "max": 1.8, "unit": "ng/dL"}
        ],
        "criticalLow": 0.5,
        "criticalHigh": 3.0
    },

    # PANEL 7 — Vitamin D
    {
        "id": "vitamin_d",
        "name": "Vitamin D",
        "aliases": ["Vitamin D Total", "25-OH Vitamin D", "25-Hydroxyvitamin D", "Vit D", "Vitamin D3", "Cholecalciferol", "25(OH)D", "Vit. D Total", "Vitamin D 25-Hydroxy"],
        "panel": "Vitamin D",
        "content": "Vitamin D regulates calcium absorption, bone health, and immune function. Levels below 20 mean deficiency, insufficient 20-29, sufficient 30-100. This is a very common deficiency in Pakistan due to sun avoidance and clothing.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 30, "max": 100, "unit": "ng/mL"}
        ],
        "criticalLow": 10,
        "criticalHigh": 150
    },

    # PANEL 8 — COVID-19 PCR (Qualitative)
    {
        "id": "covid_pcr",
        "name": "COVID-19 PCR",
        "aliases": ["COVID PCR", "SARS-CoV-2 PCR", "Coronavirus PCR", "COVID-19 RT-PCR", "RT-PCR Covid", "SARS CoV 2", "COVID-19 PCR Test", "Corona PCR"],
        "panel": "COVID-19 PCR",
        "content": "The RT-PCR test detects SARS-CoV-2 RNA. A positive result indicates an active COVID-19 infection requiring isolation. A negative result means no viral RNA was detected at the time of testing.",
        "ranges": [],
        "qualitative": True,
        "positiveStatus": "Needs Attention",
        "negativeStatus": "Good"
    },

    # PANEL 9 — Dengue NS1 Antigen (Qualitative)
    {
        "id": "dengue_ns1",
        "name": "Dengue NS1 Antigen",
        "aliases": ["NS1 Antigen", "Dengue NS1", "NS1 Ag", "Dengue Antigen", "NS1", "Dengue NS1 Ag"],
        "panel": "Dengue NS1",
        "content": "NS1 detects dengue virus early in infection days 1-9. A positive result indicates active dengue infection. Monitor platelet count carefully with positive dengue as it commonly causes dangerous platelet drops below critical levels.",
        "ranges": [],
        "qualitative": True,
        "positiveStatus": "Critical",
        "negativeStatus": "Good"
    },

    # PANEL 10 — Urine Routine Examination
    {
        "id": "urine_ph",
        "name": "Urine pH",
        "aliases": ["pH", "Urine Reaction", "Reaction", "Urine pH Value"],
        "panel": "Urine RE",
        "content": "Urine pH measures acidity. Very acid below 4.5 indicates acidosis, very alkaline above 8.0 indicates UTI or kidney disease.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 4.5, "max": 8.0, "unit": ""}
        ]
    },
    {
        "id": "specific_gravity",
        "name": "Specific Gravity",
        "aliases": ["Urine Specific Gravity", "S. Gravity", "SG", "Sp. Gravity", "Sp Gravity"],
        "panel": "Urine RE",
        "content": "Urine concentration measure. Low below 1.005 indicates dilute urine or diabetes insipidus, high above 1.030 indicates dehydration.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 1.005, "max": 1.030, "unit": ""}
        ]
    },
    {
        "id": "urine_rbc",
        "name": "Urine RBC",
        "aliases": ["RBC Urine", "Red Blood Cells Urine", "Hematuria", "Red Cells Urine", "RBC/HPF"],
        "panel": "Urine RE",
        "content": "RBCs in urine. Above 2/HPF indicates hematuria from infection, kidney stones or kidney disease.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 2, "unit": "/HPF"}
        ],
        "criticalHigh": 50
    },
    {
        "id": "urine_wbc",
        "name": "Urine WBC / Pus Cells",
        "aliases": ["WBC Urine", "Pus Cells", "White Blood Cells Urine", "Pus Cells/HPF", "Pus Cell", "WBCs Urine"],
        "panel": "Urine RE",
        "content": "Pus cells indicate UTI. Above 5/HPF confirms urinary tract infection, above 50/HPF is severe infection.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 5, "unit": "/HPF"}
        ],
        "criticalHigh": 50
    },
    {
        "id": "urine_protein",
        "name": "Urine Protein",
        "aliases": ["Protein Urine", "Albumin Urine", "Proteinuria", "Urine Albumin", "Protein"],
        "panel": "Urine RE",
        "content": "Protein normally absent in urine. Positive indicates kidney damage, hypertension complications or diabetes nephropathy.",
        "ranges": [],
        "qualitative": True,
        "positiveStatus": "Needs Attention",
        "negativeStatus": "Good"
    },
    {
        "id": "urine_glucose",
        "name": "Urine Glucose",
        "aliases": ["Glucose Urine", "Urine Sugar", "Glycosuria", "Sugar Urine"],
        "panel": "Urine RE",
        "content": "Glucose normally absent in urine. Positive usually indicates uncontrolled diabetes or renal glycosuria.",
        "ranges": [],
        "qualitative": True,
        "positiveStatus": "Needs Attention",
        "negativeStatus": "Good"
    },
    {
        "id": "urine_bacteria",
        "name": "Urine Bacteria",
        "aliases": ["Bacteria Urine", "Bacteriuria", "Bacteria", "Bacterial Cells"],
        "panel": "Urine RE",
        "content": "Bacteria absent in normal urine. Positive indicates urinary tract infection requiring antibiotic treatment.",
        "ranges": [],
        "qualitative": True,
        "positiveStatus": "Needs Attention",
        "negativeStatus": "Good"
    },
    {
        "id": "urine_casts",
        "name": "Urine Casts",
        "aliases": ["Casts", "Urinary Casts", "Granular Casts", "Hyaline Casts", "Cast"],
        "panel": "Urine RE",
        "content": "Cylindrical particles from kidney tubules. Granular or cellular casts indicate kidney disease.",
        "ranges": [
            {"sex": "any", "minAge": 0, "maxAge": 120, "min": 0, "max": 2, "unit": "/LPF"}
        ]
    },
    {
        "id": "urine_crystals",
        "name": "Urine Crystals",
        "aliases": ["Crystals", "Urinary Crystals", "Crystal"],
        "panel": "Urine RE",
        "content": "Normally absent. Oxalate or uric acid crystals may indicate kidney stones.",
        "ranges": [],
        "qualitative": True,
        "positiveStatus": "Needs Attention",
        "negativeStatus": "Good"
    }
]
