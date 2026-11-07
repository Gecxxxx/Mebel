import io
import json
import unittest
from unittest.mock import patch
import bootstrap_tls


class CertificateReadiness(unittest.TestCase):
    def responses(self, addresses, ipv6=(), marker=None):
        values = [
            json.dumps({'Status': 0, 'Answer': [{'type': 1, 'data': ip} for ip in addresses]}).encode(),
            json.dumps({'Status': 0, 'Answer': [{'type': 28, 'data': ip} for ip in ipv6]}).encode(),
            (marker if marker is not None else bootstrap_tls.PROBE).encode(),
        ]
        def request(*args, **kwargs):
            response = io.BytesIO(values.pop(0))
            response.status = 200
            return response
        return request

    def test_old_cloudflare_dns_does_not_attempt_http_validation(self):
        with patch('urllib.request.urlopen', side_effect=self.responses(['188.114.96.0', '188.114.97.0'])) as request:
            self.assertFalse(bootstrap_tls.resolves_here('prioritetmebel48.ru'))
            self.assertEqual(request.call_count, 2)

    def test_mixed_addresses_are_not_ready(self):
        with patch('urllib.request.urlopen', side_effect=self.responses([bootstrap_tls.ADDRESS, '192.0.2.1'])):
            self.assertFalse(bootstrap_tls.resolves_here('prioritetmebel48.ru'))

    def test_stale_ipv6_prevents_certificate_request(self):
        with patch('urllib.request.urlopen', side_effect=self.responses([bootstrap_tls.ADDRESS], ['2001:db8::1'])):
            self.assertFalse(bootstrap_tls.resolves_here('prioritetmebel48.ru'))

    def test_correct_dns_with_wrong_http_destination_is_not_ready(self):
        with patch('urllib.request.urlopen', side_effect=self.responses([bootstrap_tls.ADDRESS], marker='old site')):
            self.assertFalse(bootstrap_tls.resolves_here('prioritetmebel48.ru'))

    def test_direct_dns_and_matching_public_http_are_ready(self):
        with patch('urllib.request.urlopen', side_effect=self.responses([bootstrap_tls.ADDRESS])):
            self.assertTrue(bootstrap_tls.resolves_here('prioritetmebel48.ru'))


if __name__ == '__main__':
    unittest.main()
