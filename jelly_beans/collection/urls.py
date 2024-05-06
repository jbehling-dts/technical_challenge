from django.urls import path
from . import views

urlpatterns = [
    path('', views.collection, name='collection'),
    path('jar-create/', views.jarCreate, name='jar-create'),
    path('jar-edit/<int:jar_id>/', views.jarEdit, name='jar-edit'),
    path('jar-delete/', views.jarDelete, name='jar-delete'),
    path('flavor-create/', views.flavorCreate, name='flavor-create'),
    path('flavor-edit/<int:flavor_id>/', views.flavorEdit, name='flavor-edit'),
    path('flavor-delete/', views.flavorDelete, name='flavor-delete'),
    path('bean-create/', views.beanCreate, name='bean-create'),
    path('bean-edit/<int:bean_id>/', views.beanEdit, name='bean-edit'),
    path('bean-delete/', views.beanDelete, name='bean-delete')
]