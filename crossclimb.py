from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from wordfreq import top_n_list

# Top common English words
words = top_n_list("en", 50000)

WORD_LENGTH = 5

# Only 5-letter words
n_letter_words = [
    w.lower()
    for w in words
    if len(w) == WORD_LENGTH and w.isalpha()
]

print(n_letter_words[:50])

model = SentenceTransformer('all-MiniLM-L6-v2')

clue_list = ["holes in the skin", "exposes, as one's emotions or teeth",
              "is interested", "jabs with one's finger", 
              "make someone yawn by giving an overly long presentation"]

# clue_list = ["valuable metal whose atomic symbol is Au", 
#                "here ____ nothing (take a chance on something but expect to fail)",
#                "better than average, but not yet great",
#                "parts of a footprint",
#                "sticky substances"]

answer_list = ["pores", "bares", "cares", "pokes", "bores"]

word_embs = model.encode(n_letter_words)

clue_to_word_list = []

for clue in clue_list:

    clue_emb = model.encode([clue])

    scores = cosine_similarity(clue_emb, word_embs)[0]

    score_tups = []

    for w, s in zip(n_letter_words, scores):
        if w not in clue:
            score_tups.append((w,s))
    
    score_tups.sort(key=lambda x: x[1],reverse=True)
    
    clue_to_word_list.append(score_tups)

curr_pivot_word = ""
curr_score = 0.0

for scores in clue_to_word_list:
    if scores[0][1] > curr_score:
        curr_score = scores[0][1]
        curr_pivot_word = scores[0][0]

print(curr_pivot_word, curr_score)

    
    
