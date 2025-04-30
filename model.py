import pickle
import pandas as pd

def load_model():
    fashion_dict = pickle.load(open('fashion1.pkl', 'rb'))
    fashion_df = pd.DataFrame(fashion_dict)
    similarity = pickle.load(open('similarity2.pkl', 'rb'))
    return fashion_df, similarity

def recommend(fashion_item, fashion_df, similarity):
    try:
        fashion_index = fashion_df[fashion_df['title'] == fashion_item].index[0]
        distances = similarity[fashion_index]
        fashion_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:11]

        recommended_fashion = []
        recommended_images = []

        for i in fashion_list:
            recommended_fashion.append(fashion_df.iloc[i[0]].title)
            recommended_images.append(fashion_df.iloc[i[0]].link)

        return recommended_fashion, recommended_images
    except IndexError:
        return [], []