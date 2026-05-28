from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from wordfreq import top_n_list

# Top common English words
words = top_n_list("en", 50000)

# Only 5-letter words
five_letter_words = [
    w.lower()
    for w in words
    if len(w) == 5 and w.isalpha()
]

print(five_letter_words[:50])

model = SentenceTransformer('all-MiniLM-L6-v2')

clue_list = ["holes in the skin", "exposes, as one's emotions or teeth",
              "is interested", "jabs with one's finger", 
              "make someone yawn by giving an overly long presentation"]

answer_list = ["pores", "bares", "cares", "pokes", "bores"]



word_embs = model.encode(five_letter_words)

for clue in clue_list:

    clue_emb = model.encode([clue])

    scores = cosine_similarity(clue_emb, word_embs)[0]

    print("Clue:", clue)
    print("-------------------------------------------")

    for w, s in sorted(zip(five_letter_words, scores), key=lambda x: x[1], reverse=True)[:15]:
        if w not in clue:
            print(w, s)
    
    print("-------------------------------------------")