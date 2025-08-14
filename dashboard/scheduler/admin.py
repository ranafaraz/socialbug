from django.contrib import admin
from .models import WordPressAccount, ScheduledPost

admin.site.register(WordPressAccount)
admin.site.register(ScheduledPost)
