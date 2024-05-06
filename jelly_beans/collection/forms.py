from django import forms
from django.core.validators import MaxValueValidator
from .models import Jar, Flavor, Bean


class JarForm(forms.ModelForm):
    class Meta:
        model = Jar
        fields = ['name', 'bean_capacity']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['bean_capacity'].initial = 25   
        self.fields['bean_capacity'].label = 'Bean Capacity (1-50)'
        self.fields['bean_capacity'].validators.append(MaxValueValidator(50))        

class BeanForm(forms.ModelForm):
    class Meta:
        model = Bean
        fields = ['size', 'flavor', 'jar']  

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set the default value for the 'size' field to 1
        self.fields['size'].initial = 1   
        self.fields['size'].label = 'Bean Size (1-5)'
        self.fields['size'].validators.append(MaxValueValidator(5)) # Set the max bean size        
        # Set the widget of the 'jar' field to HiddenInput. 
        # This field will be set to whatever jar is currently in view on the collection page.
        self.fields['jar'].widget = forms.HiddenInput() 

class FlavorForm(forms.ModelForm):
    class Meta:
        model = Flavor
        fields = ['name', 'color']    