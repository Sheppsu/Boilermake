import requests

metadata_endpoint = "https://graph.mapillary.com"
x_dist = 0.00025
y_dist = 0.00025
testpoint=[51.1543669,4.4436676]
client_token = 'MLY|9816722291711618|2874ae2131c7527917bcf48667cfd30d'
headers= { "Authorization" : "OAuth {}".format(client_token) }
# DOCS: https://www.mapillary.com/developer/api-documentation/#image (see "Image search")
url_imagesearch = metadata_endpoint+'/images?fields=id&bbox= {},{},{},{}'.format(testpoint[1]-x_dist, testpoint[0]-y_dist, testpoint[1]+x_dist, testpoint[0]+y_dist)
response_imagesearch = requests.get(url_imagesearch, headers=headers)
data_imagesearch = response_imagesearch.json()
print("Images found:" + str(len(data_imagesearch['data'])))
for image in data_imagesearch['data']:
    # DOCS: https://www.mapillary.com/developer/api-documentation/#image
    url_image = metadata_endpoint+'/{}?fields=id,thumb_2048_url,captured_at,sequence'.format(image['id'])
    response_image = requests.get(url_image, headers=headers)
    data_image = response_image.json()
    print(data_image)