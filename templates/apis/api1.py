import json, requests
from pprint import pprint

L1000FWD_URL = 'http://amp.pharm.mssm.edu/L1000FWD/'

query_string = 'dex'
response = requests.get(L1000FWD_URL + 'synonyms/' + query_string)
if response.status_code == 200:
	pprint(response.json())
	json.dump(response.json(), open('api1_result.json', 'wb'), indent=4)
