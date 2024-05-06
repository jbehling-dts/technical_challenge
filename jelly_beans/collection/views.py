from django.shortcuts import render
from django.http import JsonResponse
import json
from django.template.loader import render_to_string
from .models import Jar, Flavor, Bean
from .forms import JarForm, FlavorForm, BeanForm

# Create your views here.
def collection(request):
    # ----------------------------------------
    # Query and format the data
    # ----------------------------------------

    jars = Jar.objects.prefetch_related('bean_set__flavor')
    flavors = Flavor.objects.all()

    # Create a list of jar data from the result set. Each item will be in the following format:
    """
    'jar': {
       'id': jar.id,
       'name': jar.name, 
       'bean_capacity': jar.bean_capacity, 
       'beans': {
            'id': bean.id,
            'size': bean.size,
            'flavor': {
                'id': flavor.id,
                'name': flavor.name,
                'color': flavor.color            
            }    
        } 
    }
    """
    jars_data = []
    for jar in jars:
        jars_data.append(setJarDictFields(jar))

    # Create a list of flavor data from the flavor result set. Each item will be in the following format:
    """
    'flavor': {
        'id': flavor.id,
        'name': flavor.name,
        'color': flavor.color            
    }      
    """
    flavors_data = []
    for flavor in flavors:
        flavors_data.append(setFlavorDictFields(flavor))
     

    # --------------------------------------------------------------------------------
    # Render html forms to strings and create modal settings for modal snippets:
    # Each of the objects (jar, bean, and flavor) will have an empty form initialized
    # and rendered to an html string which will then be passed to the modal settings.
    # An additional modal settings will be created for the edit form of each object.
    # The edit modals will be populated with form html returned from an AJAX request.
    # --------------------------------------------------------------------------------

    jar_form_create = JarForm(prefix='create')
    jar_form_create_html = render_to_string('snippets/jar_form.html', {'jar_form': jar_form_create}, request=request)
    jar_form_create_modal_settings = {
        'id': 'jar_modal_create',
        'title': 'Create a Jar',
        'body': jar_form_create_html
    }
    jar_form_edit_modal_settings = {
        'id': 'jar_modal_edit',
        'title': 'Edit Jar',
        'body': '<div id="insert-jar-edit-form-here"></div>'        
    }

    bean_form = BeanForm(prefix="create")
    bean_form_html = render_to_string('snippets/bean_form.html', {'bean_form': bean_form}, request=request)
    bean_form_create_modal_settings = {
        'id': 'bean_modal_create',
        'title': 'Add a New Jelly Bean',
        'body': bean_form_html
    } 
    bean_form_edit_modal_settings = {
        'id': 'bean_modal_edit',
        'title': 'Edit Jelly Bean',
        'body': '<div id="insert-bean-edit-form-here"></div>'  
    }     

    flavor_form_create = FlavorForm(prefix="create")
    flavor_form_create_html = render_to_string('snippets/flavor_form.html', {'flavor_form': flavor_form_create}, request=request)
    flavor_form_create_modal_settings = {
        'id': 'flavor_modal_create',
        'title': 'Create a New Flavor',
        'body': flavor_form_create_html
    } 
    flavor_form_edit_modal_settings = {
        'id': 'flavor_modal_edit',
        'title': 'Edit Flavor',
        'body': '<div id="insert-flavor-edit-form-here"></div>'        
    }  

    # The notification modal will be for "Confirm Delete" type messages.
    notification_modal_settings = {
        'id': 'notification_modal',
        'title': 'Notification',
        'body': '<div id="insert-message-here"></div>'        
    }  


    context = { 
        'jars_data': jars_data,
        'flavors_data': flavors_data,
        'jar_form_create_modal_settings': jar_form_create_modal_settings,
        'jar_form_edit_modal_settings': jar_form_edit_modal_settings,
        'bean_form_create_modal_settings': bean_form_create_modal_settings,
        'bean_form_edit_modal_settings': bean_form_edit_modal_settings,
        'flavor_form_create_modal_settings': flavor_form_create_modal_settings,
        'flavor_form_edit_modal_settings': flavor_form_edit_modal_settings,
        'notification_modal_settings': notification_modal_settings
    }
    
    return render(request, 'collection.html', context)

# -------------------------------------------------------------
# Jar Create, Edit, and Delete routes
# -------------------------------------------------------------
def jarCreate(request):
    if request.method == 'POST':
        jar_form = JarForm(request.POST, prefix='create')
        
        if jar_form.is_valid():
            cleaned_data = jar_form.cleaned_data

            new_jar = Jar()
            setJarObjectFields(new_jar, cleaned_data)
            new_jar.save()
            
            response_data = setJarDictFields(new_jar)

            return JsonResponse(response_data)
        
        # If the form is not valid, return the form errors
        errors = dict(jar_form.errors.items())  # Serialize form errors
        return JsonResponse({'error': 'Form validation failed', 'errors': errors}, status=400)          
        
    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405)        
        
def jarEdit(request, jar_id):
    # Retrieve the jar that will be edited
    jar_to_edit = Jar.objects.prefetch_related('bean_set__flavor').get(id=jar_id)

    if not jar_to_edit:
        return JsonResponse({'error': 'Jar with specified ID cannot be found'}, status=405)      
     
    if request.method == 'GET':
        jar_form_edit = JarForm(instance=jar_to_edit, prefix='edit')
        jar_form_edit_html = render_to_string('snippets/jar_form.html', {'jar_form': jar_form_edit}, request=request)
        return JsonResponse({ 'html': jar_form_edit_html })  
     
    elif request.method == 'POST':
        jar_form_edit = JarForm(request.POST, prefix='edit')
        
        if jar_form_edit.is_valid():
            cleaned_data = jar_form_edit.cleaned_data
            
            setJarObjectFields(jar_to_edit, cleaned_data)
            jar_to_edit.save()
            
            response_data = setJarDictFields(jar_to_edit)
            return JsonResponse(response_data) 

        # If the form is not valid, return the form errors
        errors = dict(jar_form_edit.errors.items())  # Serialize form errors
        return JsonResponse({'error': 'Form validation failed', 'errors': errors}, status=400)                

    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405)                  
        
def jarDelete(request):
    return deleteLogic(request, Jar, 'Jar')

# -------------------------------------------------------------
# Flavor Create, Edit, and Delete routes
# -------------------------------------------------------------
def flavorCreate(request):
    if request.method == 'POST':
        flavor_form = FlavorForm(request.POST, prefix="create")
        
        if flavor_form.is_valid():
            cleaned_data = flavor_form.cleaned_data

            new_flavor = Flavor(
                name=cleaned_data['name'],
                color=cleaned_data['color']
            )
            new_flavor.save()
            
            response_data = setFlavorDictFields(new_flavor)

            return JsonResponse(response_data)
        
        # If the form is not valid, return the form errors
        errors = dict(flavor_form.errors.items())  # Serialize form errors
        return JsonResponse({'error': 'Form validation failed', 'errors': errors}, status=400)            
        
    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405) 

def flavorEdit(request, flavor_id):
    # Retrieve the flavor that will be edited
    flavor_to_edit = Flavor.objects.get(id=flavor_id)

    if not flavor_to_edit:
        return JsonResponse({'error': 'Flavor with specified ID cannot be found'}, status=405)      
     
    if request.method == 'GET':
        flavor_form_edit = FlavorForm(instance=flavor_to_edit, prefix='edit')
        flavor_form_edit_html = render_to_string('snippets/flavor_form.html', {'flavor_form': flavor_form_edit}, request=request)
        return JsonResponse({ 'html': flavor_form_edit_html })  
     
    elif request.method == 'POST':
        flavor_form_edit = FlavorForm(request.POST, prefix='edit')
        
        if flavor_form_edit.is_valid():
            cleaned_data = flavor_form_edit.cleaned_data
            
            setFlavorObjectFields(flavor_to_edit, cleaned_data)
            flavor_to_edit.save()
            
            response_data = setFlavorDictFields(flavor_to_edit)
            return JsonResponse(response_data)  
        
        # If the form is not valid, return the form errors
        errors = dict(flavor_form_edit.errors.items())  # Serialize form errors
        return JsonResponse({'error': 'Form validation failed', 'errors': errors}, status=400)           

    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405) 

def flavorDelete(request):
    return deleteLogic(request, Flavor, 'Flavor')

# -------------------------------------------------------------
# Bean Create, Edit, and Delete routes
# -------------------------------------------------------------
def beanCreate(request):
    if request.method == 'POST':
        bean_form = BeanForm(request.POST, prefix="create")
        
        if bean_form.is_valid():
            cleaned_data = bean_form.cleaned_data

            new_bean = Bean()
            setBeanObjectFields(new_bean, cleaned_data)
            new_bean.save()
            
            response_data = setBeanDictFields(new_bean)

            return JsonResponse(response_data)
        
        # If the form is not valid, return the form errors
        errors = dict(bean_form.errors.items())  # Serialize form errors
        return JsonResponse({'error': 'Form validation failed', 'errors': errors}, status=400)        
        
    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405) 

def beanEdit(request, bean_id):
    # Retrieve the bean that will be edited
    bean_to_edit = Bean.objects.get(id=bean_id)

    if not bean_to_edit:
        return JsonResponse({'error': 'Bean with specified ID cannot be found'}, status=405)      
     
    if request.method == 'GET':
        bean_form_edit = BeanForm(instance=bean_to_edit, prefix='edit')
        bean_form_edit_html = render_to_string('snippets/bean_form.html', {'bean_form': bean_form_edit}, request=request)
        return JsonResponse({ 'html': bean_form_edit_html })  
     
    elif request.method == 'POST':
        bean_form_edit = BeanForm(request.POST, prefix='edit')
        
        if bean_form_edit.is_valid():
            cleaned_data = bean_form_edit.cleaned_data
            
            setBeanObjectFields(bean_to_edit, cleaned_data)
            bean_to_edit.save()
            
            response_data = setBeanDictFields(bean_to_edit)
            return JsonResponse(response_data)  
        
        # If the form is not valid, return the form errors
        errors = dict(bean_form_edit.errors.items())  # Serialize form errors
        return JsonResponse({'error': 'Form validation failed', 'errors': errors}, status=400)   

    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405) 

def beanDelete(request):
    return deleteLogic(request, Bean, 'Bean')



# All the delete routes use the same logic for different objects, so we'll just reuse this function.
def deleteLogic(request, DeleteObject, object_name):
    if request.method == 'POST':
        post_data = json.loads(request.body)
        id = post_data.get('id')

        try:
            # Try to get the Jar object with the specified ID
            item_to_delete = DeleteObject.objects.get(id=id)
            item_to_delete.delete()
            return JsonResponse({'success': True})
        except DeleteObject.DoesNotExist:
            # Return error response if jar with specified ID does not exist
            return JsonResponse({'success': False, 'error': f'{object_name} with specified ID does not exist'}, status=404)
        except Exception as e:
            # Return error response if any other error occurs
            return JsonResponse({'success': False, 'error': str(e)})

    # Handle invalid requests
    return JsonResponse({'error': 'Invalid request method'}, status=405)



# The following functions are repeated accross the create and edit functions.
# setObjectFields will set the fields for the object class which will then be committed to the database.
# setJarDictFields will create a dictionary object which will be returned to the AJAX request. 
# This will help keep the front end data up to date.
def setJarObjectFields(jar, cleaned_data):
    jar.name = cleaned_data['name']
    jar.bean_capacity = cleaned_data['bean_capacity']

def setJarDictFields(jar):
    beans_data = []
    for bean in jar.bean_set.all():
        beans_data.append(setBeanDictFields(bean))    
    return {
        'id': jar.id,
        'name': jar.name, 
        'bean_capacity': jar.bean_capacity, 
        'beans': beans_data 
    }

def setFlavorObjectFields(flavor, cleaned_data):
    flavor.name = cleaned_data['name']
    flavor.color = cleaned_data['color']

def setFlavorDictFields(flavor):
    return {
        'id': flavor.id,
        'name': flavor.name,
        'color': flavor.color
    } 

def setBeanObjectFields(bean, cleaned_data):
    bean.size = cleaned_data['size']
    bean.flavor = cleaned_data['flavor']
    bean.jar = cleaned_data['jar']

def setBeanDictFields(bean):
    return {
        'id': bean.id,
        'size': bean.size,
        'flavor': setFlavorDictFields(bean.flavor)
    }    

