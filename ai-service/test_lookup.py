from services.rag_service import find_reference_range, classify_value
import json

range_obj = find_reference_range("Neutrophils", 30, "male")
print(json.dumps(range_obj, indent=2))
print("Status:", classify_value(66.8, range_obj))

range_obj_lym = find_reference_range("Lymphocytes", 30, "male")
print(json.dumps(range_obj_lym, indent=2))
print("Status:", classify_value(26.6, range_obj_lym))
