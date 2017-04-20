from urlparse import urljoin, urlparse

from bs4 import BeautifulSoup
from django.conf import settings

from websites.base.shared_conf.general import GE_SITE_ID
from websites.base.utils.logging import sentry_client as sc


BASE_MEDIA_PATH = '/media/'


def fix_urls(s):
    soup = BeautifulSoup(s, 'html.parser')

    # explicit dirty flag because we want to be as conservative as possible; many or
    # most posts won't need modification, so why take the chance that BeautifulSoup
    # could screw something up when re-serializing the html? instead we just return
    # the original string unmodified -- to be safe
    dirty = False

    for img in soup.find_all('img'):
        if not img.get('src'):
            continue
        if _clean_img_src(img):
            dirty = True

    for a in soup.find_all('a'):
        if not a.get('href'):
            continue
        if _clean_a_href(a):
            dirty = True

    if dirty:
        return soup.encode(formatter='html')
    else:
        return s


def _clean_a_href(a):
    dirty = False
    href = a['href'].strip()
    parsed_url = urlparse(href)

    # looking for links pointing to /media/ assets with admin URLs
    if parsed_url.netloc == 'admin.govexec.com':
        if parsed_url.path.startswith(BASE_MEDIA_PATH):
            a['href'] = urljoin(
                settings.SITE_ID_TO_CDN_MEDIA[GE_SITE_ID],
                parsed_url.path[len(BASE_MEDIA_PATH):] +
                ('?' + parsed_url.query if parsed_url.query else '')
            )
            dirty = True
        else:
            sc().captureMessage(
                u'Unhandled admin anchor href path: {}'.format(href), stack=True
            )

    return dirty


def _clean_img_src(img):
    dirty = False

    img_src = img.get('src').strip()
    parsed_src = urlparse(img_src)

    # looking for relative '/media/...' paths
    if not parsed_src.netloc:
        if img_src.startswith(BASE_MEDIA_PATH):
            img['src'] = urljoin(
                settings.SITE_ID_TO_CDN_MEDIA[GE_SITE_ID],
                img_src[len(BASE_MEDIA_PATH):]
            )
            dirty = True
        else:
            sc().captureMessage(
                u'Unhandled relative img path: {}'.format(img_src), stack=True
            )

    # looking for paths that reference an admin URL instead of a site URL
    if parsed_src.netloc == 'admin.govexec.com':
        if parsed_src.path.startswith(BASE_MEDIA_PATH):
            img['src'] = urljoin(
                settings.SITE_ID_TO_CDN_MEDIA[GE_SITE_ID],
                parsed_src.path[len(BASE_MEDIA_PATH):] +
                ('?' + parsed_src.query if parsed_src.query else '')
            )
            dirty = True
        else:
            sc().captureMessage(
                u'Unhandled admin img path: {}'.format(img_src), stack=True
            )

    return dirty
