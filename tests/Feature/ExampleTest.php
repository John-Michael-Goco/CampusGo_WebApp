<?php

test('home redirects to login page', function () {
    $response = $this->get(route('home'));

    $response->assertRedirect('/login');
});