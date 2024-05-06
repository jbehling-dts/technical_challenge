from django.db import models

# Create your models here.
class Jar(models.Model):
    name = models.CharField(max_length=255)
    bean_capacity = models.IntegerField()   

class Flavor(models.Model):
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7)
    
    def __str__(self):
            return self.name     

class Bean(models.Model):
    size = models.IntegerField()
    flavor = models.ForeignKey(Flavor, on_delete=models.CASCADE)
    jar = models.ForeignKey(Jar, on_delete=models.CASCADE)