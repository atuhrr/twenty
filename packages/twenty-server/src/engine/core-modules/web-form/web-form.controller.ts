// FORK: Voka CRM — Fase 15: Public endpoints (no auth)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { WebFormService } from 'src/engine/core-modules/web-form/web-form.service';
import { type WebFormField } from 'src/engine/core-modules/web-form/web-form.entity';

@Controller('public')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
export class WebFormController {
  constructor(private readonly webFormService: WebFormService) {}

  // ── Public form HTML ────────────────────────────────────────────────────────

  @Get('web-forms/:token')
  async renderForm(@Param('token') token: string, @Res() res: Response) {
    const form = await this.webFormService.findByToken(token);

    if (!form) {
      res.status(404).send('<h2>Formulário não encontrado.</h2>');

      return;
    }

    const fieldsHtml = form.fields
      .map((f: WebFormField) => {
        const required = f.required ? 'required' : '';
        const label = `<label style="display:block;margin-bottom:4px;font-size:13px;font-weight:600;color:#344054">${f.label}${f.required ? ' *' : ''}</label>`;

        if (f.type === 'select' && f.options?.length) {
          const opts = f.options
            .map((o) => `<option value="${o}">${o}</option>`)
            .join('');

          return `<div style="margin-bottom:16px">${label}<select name="${f.id}" ${required} style="width:100%;padding:9px 12px;border:1px solid #D0D5DD;border-radius:8px;font-size:14px;outline:none">${opts}</select></div>`;
        }

        if (f.type === 'textarea') {
          return `<div style="margin-bottom:16px">${label}<textarea name="${f.id}" placeholder="${f.placeholder ?? ''}" ${required} style="width:100%;padding:9px 12px;border:1px solid #D0D5DD;border-radius:8px;font-size:14px;min-height:80px;outline:none;resize:vertical"></textarea></div>`;
        }

        const inputType =
          f.type === 'email' ? 'email' : f.type === 'phone' ? 'tel' : 'text';

        return `<div style="margin-bottom:16px">${label}<input type="${inputType}" name="${f.id}" placeholder="${f.placeholder ?? ''}" ${required} style="width:100%;padding:9px 12px;border:1px solid #D0D5DD;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box"></div>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${form.name}</title>
<style>*{box-sizing:border-box;font-family:'Plus Jakarta Sans',Inter,sans-serif}body{margin:0;background:#F2F4F7;display:flex;align-items:center;justify-content:center;min-height:100vh}.card{background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,.08);padding:32px;width:100%;max-width:480px}h2{margin:0 0 24px;font-size:20px;color:#101828}.btn{width:100%;background:#7C3AED;color:#fff;border:none;border-radius:8px;padding:12px;font-size:15px;font-weight:700;cursor:pointer}.btn:hover{opacity:.9}#msg{display:none;text-align:center;padding:24px;color:#12B76A;font-size:16px;font-weight:700}</style>
</head>
<body>
<div class="card">
  <h2>${form.name}</h2>
  <form id="f" onsubmit="submit(event)">
    ${fieldsHtml}
    <button class="btn" type="submit">Enviar</button>
  </form>
  <div id="msg">✓ Recebemos sua mensagem! Em breve entraremos em contato.</div>
</div>
<script>
async function submit(e){
  e.preventDefault();
  const fd=new FormData(e.target);
  const data={};
  fd.forEach((v,k)=>{data[k]=v});
  try{
    await fetch('/public/web-forms/${token}/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    document.getElementById('f').style.display='none';
    document.getElementById('msg').style.display='block';
  }catch(err){alert('Erro ao enviar. Tente novamente.');}
}
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  // ── Form submission ─────────────────────────────────────────────────────────

  @Post('web-forms/:token/submit')
  @HttpCode(HttpStatus.OK)
  async submitForm(
    @Param('token') token: string,
    @Body() data: Record<string, string>,
  ) {
    return this.webFormService.handleSubmission(token, data, 'WEB_FORM');
  }

  // ── Chat widget JS ──────────────────────────────────────────────────────────

  @Get('chat-widget/:workspaceId/widget.js')
  renderWidgetJs(@Param('workspaceId') workspaceId: string, @Res() res: Response) {
    const origin = process.env.SERVER_URL ?? 'http://localhost:3000';

    const js = `
(function(){
  if(window.__vokaChatLoaded) return;
  window.__vokaChatLoaded = true;

  var ORIGIN = '${origin}';
  var WS_ID = '${workspaceId}';

  // Floating button
  var btn = document.createElement('div');
  btn.id = '__voka-btn';
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>';
  Object.assign(btn.style,{position:'fixed',bottom:'24px',right:'24px',width:'56px',height:'56px',background:'#7C3AED',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 16px rgba(124,58,237,.4)',zIndex:999999,transition:'transform .15s'});
  btn.onmouseenter=function(){btn.style.transform='scale(1.08)'};
  btn.onmouseleave=function(){btn.style.transform='scale(1)'};
  document.body.appendChild(btn);

  // Chat panel
  var panel = document.createElement('div');
  panel.id = '__voka-panel';
  panel.style.cssText='position:fixed;bottom:90px;right:24px;width:340px;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);font-family:Inter,sans-serif;overflow:hidden;z-index:999998;display:none';
  panel.innerHTML=[
    '<div style="background:#7C3AED;padding:16px 20px;color:#fff">',
    '<div style="font-weight:700;font-size:16px">Falar com a gente</div>',
    '<div style="font-size:12px;opacity:.8;margin-top:2px">Deixe seus dados e respondemos em breve</div>',
    '</div>',
    '<div style="padding:20px" id="__voka-form-wrap">',
    '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:#344054;display:block;margin-bottom:4px">Nome *</label>',
    '<input id="__vk-name" type="text" placeholder="Seu nome" style="width:100%;padding:9px 12px;border:1px solid #D0D5DD;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box"></div>',
    '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:#344054;display:block;margin-bottom:4px">Telefone</label>',
    '<input id="__vk-phone" type="tel" placeholder="(11) 99999-9999" style="width:100%;padding:9px 12px;border:1px solid #D0D5DD;border-radius:8px;font-size:13px;outline:none;box-sizing:border-box"></div>',
    '<div style="margin-bottom:16px"><label style="font-size:12px;font-weight:600;color:#344054;display:block;margin-bottom:4px">Mensagem</label>',
    '<textarea id="__vk-msg" placeholder="Como podemos ajudar?" style="width:100%;padding:9px 12px;border:1px solid #D0D5DD;border-radius:8px;font-size:13px;min-height:64px;outline:none;resize:none;box-sizing:border-box"></textarea></div>',
    '<button id="__vk-send" style="width:100%;background:#7C3AED;color:#fff;border:none;border-radius:8px;padding:10px;font-size:14px;font-weight:700;cursor:pointer">Enviar</button>',
    '</div>',
    '<div id="__voka-success" style="display:none;padding:32px 20px;text-align:center;color:#12B76A;font-weight:700;font-size:15px">✓ Mensagem enviada! Entraremos em contato em breve.</div>',
  ].join('');
  document.body.appendChild(panel);

  btn.onclick=function(){panel.style.display=panel.style.display==='none'?'block':'none'};

  document.getElementById('__vk-send').onclick=async function(){
    var name=document.getElementById('__vk-name').value.trim();
    if(!name){document.getElementById('__vk-name').focus();return;}
    var data={nome:name,telefone:document.getElementById('__vk-phone').value,mensagem:document.getElementById('__vk-msg').value};
    this.disabled=true;this.textContent='Enviando...';
    try{
      await fetch(ORIGIN+'/public/chat-widget/'+WS_ID+'/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
      document.getElementById('__voka-form-wrap').style.display='none';
      document.getElementById('__voka-success').style.display='block';
    }catch(e){this.disabled=false;this.textContent='Enviar';alert('Erro ao enviar. Tente novamente.');}
  };
})();
`;

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(js);
  }

  // ── Chat widget submit ──────────────────────────────────────────────────────

  @Post('chat-widget/:workspaceId/submit')
  @HttpCode(HttpStatus.OK)
  async submitChatWidget(
    @Param('workspaceId') workspaceId: string,
    @Body() data: Record<string, string>,
  ) {
    return this.webFormService.handleChatWidgetSubmission(workspaceId, data);
  }
}
