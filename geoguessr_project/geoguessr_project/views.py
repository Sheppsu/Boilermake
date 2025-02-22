from django.shortcuts import render

def map_view(request):
    return render(request, 'map.html')

def streetview_view(request):
    return render(request, 'streetview.html')