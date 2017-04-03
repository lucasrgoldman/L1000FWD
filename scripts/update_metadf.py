import os, sys
import json
import numpy as np
import pandas as pd

from sqlalchemy import create_engine

# the original meta_df from Qiaonan's L1000CDS2.cpcd-gse70138
meta_df = pd.read_csv('../data/metadata-full.tsv', sep='\t')
meta_df = meta_df.set_index('sig_id')

# print meta_df.head()
# print meta_df.shape


# connect to euclid4 database and get the `drug` table
engine = create_engine('mysql://euclid:elements@amp.pharm.mssm.edu:3306/euclid4?charset=utf8')
drugs_lincs_df = pd.read_sql('drug' , engine)
# print drugs_lincs_df.head()

d_pertid_name = dict(zip(drugs_lincs_df['pert_id'], drugs_lincs_df['pert_iname']))

meta_df['perturbation'] = meta_df['pert_id'].map(lambda x: d_pertid_name.get(x, x))

# print meta_df.head()

# get drug class from LJP 
ljp_json_file = '/Users/zichen/Documents/Zichen_Projects/HarvardNetwork/scripts/data/harvard_net_with_pos_Cidx_enriched_terms_combined_score.json'
graph = json.load(open(ljp_json_file, 'rb'))

drug_classes = [node['DrugClass'] for node in graph['nodes']]
pert_ids = [node['id'].split(':')[1] for node in graph['nodes']]
drug_names = [node['DrugName'] for node in graph['nodes']]

d_pertid_drugclass = dict(zip(pert_ids, drug_classes))
d_name_drugclass = dict(zip(drug_names, drug_classes))

# meta_df['drug_class'] = meta_df['pert_id'].map(lambda x: d_pertid_drugclass.get(x, 'unannotated'))
drug_classes = []
for i, row in meta_df.iterrows():
	pert_id = row['pert_id']
	name = row['perturbation']
	if pert_id in d_pertid_drugclass:
		drug_class = d_pertid_drugclass[pert_id]
	elif name in d_name_drugclass:
		drug_class = d_name_drugclass[name]
	else:
		drug_class = 'unannotated'
	drug_classes.append(drug_class)

meta_df['drug_class'] = drug_classes

print meta_df.head()
print meta_df['drug_class'].value_counts()
print meta_df.count()

pert_meta_df = meta_df[['pert_id', 'perturbation', 'drug_class']].drop_duplicates().set_index('pert_id')
# print pert_meta_df.head()
print pert_meta_df['drug_class'].value_counts()

# write to files
meta_df.to_csv('../data/metadata-full-anno.tsv', sep='\t')
pert_meta_df.to_csv('../data/pert-metadata.csv')

