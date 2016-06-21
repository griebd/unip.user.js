/*******************************************************************************
 * The MIT License (MIT)
 *******************************************************************************
 * Copyright (c) 2016 Adriano Grieb
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ******************************************************************************/

// ==UserScript==
// @name                unip
// @namespace           https://github.com/griebd
// @description         Helper script for 'UNIP Interativa' environment (Brazil)
// @description:pt-BR   Script para ajudar no AVA da UNIP Interativa
// @include             https://aluno.ead.unip.br/lyceump//aonline/historico.asp
// @include             http://ead.unipinterativa.edu.br/*
// @version             0.1.0
// @grant               GM_registerMenuCommand
// @grant               GM_setValue
// @grant               GM_getValue
// @grant               GM_log
// @require             https://code.jquery.com/jquery-3.0.0.min.js
// @require             https://openuserjs.org/src/libs/sizzle/GM_config.js
// ==/UserScript==

GM_config.init(
{
  'id': 'unip.user.js',
  // 'title': 'unip.user.js settings',
  'fields':
  {
    'autologin':
    {
      'label': 'Login Automático',
      'type': 'checkbox',
      'title': 'Habilita/Deshailita a função de login automático.',
      'default': false
    },
    'user_id':
    {
      'label': 'Matrícula',
      'type': 'text',
      'title': 'Usuário para a função de login automático.',
      'default': ''
    },
    'password':
    {
      'label': 'Senha',
      'type': 'text',
      'title': 'Senha para a função de login automático.',
      'default': ''
    }
  }
});
GM_registerMenuCommand('Config', config);

if (location.pathname.match(/\/lyceump\/\/aonline\/historico\.asp/))
{
  hist();
}
else if (location.pathname.match(/\/webapps\/login\//) ||
  $('body > title:contains("Login - Ambiente acadêmico - UNIP Interativa")').length)
{
  login();
}

function config()
{
  GM_config.open();
}

function login()
{
  if (GM_config.get('autologin'))
  {
    var user_id = GM_config.get('user_id');
    var password = GM_config.get('password');
    var $error_div = $('#loginErrorMessage');
    var $form = $('form[name="login"]');
    if (user_id.length) $form.find('#user_id').val(user_id);
    if (password.length) $form.find('#password').val(password);
    if (user_id.length && password.length && !$error_div.length)
    {
      $form.find('input[type="submit"][name="login"]').click();
    }
    else
    {
      $form.find('#password').on('focusout',
        function(e)
        {
          GM_config.set('password', $form.find('#password').val());
        });

      var $div = $('<div>', { class: 'clearfix' });
      var $ul = $('<ul>', { class: 'clearfix' });
      var $li = $('<li>', { class: 'clearfix' });
      var $label = $('<label>', { for: 'remember', text: 'memorizar' });
      var $input = $('<input>', { id: 'remember', type: 'checkbox', checked: '1' });
      $li.append($input, $label);
      $ul.append($li);
      $div.append($ul);

      $form.after($div);
      $form.on('submit',
        function(e)
        {
          if ($input.attr('checked'))
          {
            GM_config.set('user_id', $form.find('#user_id').val());
            GM_config.save();
          }
        });
    }
  }
}

function hist()
{
  var cht_exigida = parseInt($('td:contains("CH Exigida: "):last').text().match(/\d+/));
  var cht_cumprida = parseInt($('td:contains("CH Cumprida: "):last').text().match(/\d+/));
  var cht_cursando = 0;
  var cht_remanescente = 0;

  var chob_exigida = 0;
  var chob_cumprida = 0;
  var chob_cursando = 0;
  var chob_remanescente = 0;

  var chop_exigida = 0;
  var chop_cumprida = 0;
  var chop_cursando = 0;
  var chop_remanescente = 0;

  var chac_exigida = 300;
  var chac_cumprida = 0;
  var chac_remanescente = 0;

  $('td:contains("Período"):last').parent().siblings().each(
    function()
    {
      var ch = parseInt($(this).children(':eq(4)').text().match(/\d+/));
      var situacao = $(this).children(':eq(6)').text();
      if (situacao == 'CURSANDO') cht_cursando += ch;
      if ($(this).children(':eq(3)').text().match(/optativa/i) != null)
      {
        if (situacao == 'AP') chop_cumprida += ch;
        else if (situacao == 'CURSANDO') chop_cursando += ch;
      }
      else
      {
        chob_exigida += ch;
        if (situacao == 'AP') chob_cumprida += ch;
        else if (situacao == 'CURSANDO') chob_cursando += ch;
      }
    });
  cht_remanescente = cht_exigida - cht_cumprida - cht_cursando;
  chob_remanescente = chob_exigida - chob_cumprida - chob_cursando;
  chac_remanescente = chac_exigida - cht_cumprida + chob_cumprida + chop_cumprida;
  chac_cumprida = chac_exigida - chac_remanescente;
  chop_exigida = cht_exigida - chob_exigida - chac_exigida;
  chop_remanescente = chop_exigida - chop_cumprida - chop_cursando;

  var $tbody = $('<tbody>');
  var $tr = $('<tr>');
  $tr.append($('<th>', { class: 'font01n tr01t', text: 'Carga Horária' }));
  $tr.append($('<th>', { class: 'font01n tr01t', text: 'Obrigatória' }));
  $tr.append($('<th>', { class: 'font01n tr01t', text: 'Optativa' }));
  $tr.append($('<th>', { class: 'font01n tr01t', html: 'Atividade<br />Complementar' }));
  $tr.append($('<th>', { class: 'font01n tr01t', text: 'Total' }));
  $tbody.append($tr);
  $tr = $('<tr>');
  $tr.append($('<td>', { class: 'font01n tr01t', align: 'right', text: 'Exigida' }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chob_exigida }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chop_exigida }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chac_exigida }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: cht_exigida }));
  $tbody.append($tr);
  $tr = $('<tr>');
  $tr.append($('<td>', { class: 'font01n tr01t', align: 'right', text: 'Cumprida' }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chob_cumprida }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chop_cumprida }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chac_cumprida }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: cht_cumprida }));
  $tbody.append($tr);
  $tr = $('<tr>');
  $tr.append($('<td>', { class: 'font01n tr01t', align: 'right', text: 'Cursando'}));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chob_cursando }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chop_cursando }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: '0'}));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: cht_cursando }));
  $tbody.append($tr);
  $tr = $('<tr>');
  $tr.append($('<td>', { class: 'font01n tr01t', align: 'right', text: 'Remanescente' }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chob_remanescente}));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chop_remanescente }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: chac_remanescente }));
  $tr.append($('<td>', { class: 'font01', align: 'right', text: cht_remanescente }));
  $tbody.append($tr);

  var $table = $('<table>', { cellspacing: '1', cellpadding: '1', border: '0', align: 'right'});
  $table.append($tbody);
  $('table:contains("CH Exigida: "):last').after($table);
}
