import fitz
import os

os.makedirs('site/assets/images', exist_ok=True)
doc = fitz.open('exercise/exercise.pdf')

for page_num in range(len(doc)):
    page = doc[page_num]
    image_list = page.get_images(full=True)
    print(f'Page {page_num+1} has {len(image_list)} images')
    for img_idx, img in enumerate(image_list):
        xref = img[0]
        base_img = doc.extract_image(xref)
        image_bytes = base_img['image']
        image_ext = base_img['ext']
        w = base_img['width']
        h = base_img['height']
        img_name = f'page_{page_num+1}_img_{img_idx+1}.{image_ext}'
        out_path = os.path.join('site/assets/images', img_name)
        with open(out_path, 'wb') as f:
            f.write(image_bytes)
        print(f'  Saved {img_name} ({w}x{h})')

# Also let's render the entire pages to images for reference or if the user wants to view the original worksheet page!
os.makedirs('site/assets/pages/exercise', exist_ok=True)
for page_num in range(len(doc)):
    page = doc[page_num]
    pix = page.get_pixmap(dpi=150)
    pix.save(f'site/assets/pages/exercise/page_{page_num+1}.png')
print('Rendered all exercise pages.')

# Also render quiz pages
doc_quiz = fitz.open('quiz/quizChap3_4.pdf')
os.makedirs('site/assets/pages/quiz', exist_ok=True)
for page_num in range(len(doc_quiz)):
    page = doc_quiz[page_num]
    pix = page.get_pixmap(dpi=150)
    pix.save(f'site/assets/pages/quiz/page_{page_num+1}.png')
print('Rendered all quiz pages.')
