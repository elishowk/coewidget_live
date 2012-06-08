# -*- coding: utf-8 -*-
from django import template

register = template.Library()

@register.inclusion_tag('live/livespeaker.html')
def livespeaker(id):
    return { 'id': id }
