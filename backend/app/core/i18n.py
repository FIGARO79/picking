# backend/app/core/i18n.py

MESSAGES = {
    "es": {
        "csv_missing_columns": "El archivo CSV no contiene las columnas requeridas (ORDER_, DESPATCH_, ITEM, QTY).",
        "csv_invalid": "Archivo CSV inválido: {error}",
        "csv_not_found": "El archivo de picking no se encuentra en el servidor. Sube el archivo CSV 240 desde el Dashboard.",
        "csv_bad_columns": "El archivo CSV no tiene la estructura o las columnas esperadas para el sistema.",
        "order_not_found": "El pedido {order_number} con despacho {despatch_number} no fue encontrado en el archivo de picking.",
        "csv_updated": "Archivo '{filename}' subido y procesado con éxito.",
        "audit_saved": "Auditoría guardada con éxito en el servidor.",
        "audit_not_found": "La auditoría #{audit_id} no fue encontrada en la base de datos.",
        "shipment_created": "Envío consolidado creado con éxito.",
        "shipment_not_found": "El envío consolidado #{shipment_id} no fue encontrado.",
        "shipment_cancelled": "Despacho #{shipment_id} cancelado correctamente en el servidor.",
        "shipment_select_audit": "Debe seleccionar al menos una auditoría para consolidar.",
        "shipment_audits_not_found": "Una o más auditorías seleccionadas no fueron encontradas.",
        "shipment_created_success": "Envío #{shipment_id} creado con éxito con {count} pedido(s).",
        "shipment_already_cancelled": "El envío consolidado se encuentra cancelado.",
        "shipment_cancelled_success": "Envío #{shipment_id} cancelado con éxito.",
        "audit_updated": "Auditoría actualizada con éxito.",
        "shipment_updated_success": "Envío #{shipment_id} actualizado con éxito."
    },
    "pt": {
        "csv_missing_columns": "O arquivo CSV não contém as colunas necessárias (ORDER_, DESPATCH_, ITEM, QTY).",
        "csv_invalid": "Arquivo CSV inválido: {error}",
        "csv_not_found": "O arquivo de picking não foi encontrado no servidor. Por favor, faça upload do arquivo CSV 240 no Painel.",
        "csv_bad_columns": "O arquivo CSV não possui a estrutura ou as colunas esperadas pelo sistema.",
        "order_not_found": "O pedido {order_number} com despacho {despatch_number} não foi encontrado no arquivo de picking.",
        "csv_updated": "Arquivo '{filename}' enviado e processado com sucesso.",
        "audit_saved": "Auditoria salva com sucesso no servidor.",
        "audit_not_found": "A auditoria #{audit_id} não foi encontrada no banco de dados.",
        "shipment_created": "Envio consolidado criado com sucesso.",
        "shipment_not_found": "O envio consolidado #{shipment_id} não foi encontrado.",
        "shipment_cancelled": "Despacho #{shipment_id} cancelado com sucesso no servidor.",
        "shipment_select_audit": "Você deve selecionar pelo menos uma auditoria para consolidar.",
        "shipment_audits_not_found": "Uma ou mais auditorias seleccionadas não foram encontradas.",
        "shipment_created_success": "Envio #{shipment_id} criado com sucesso com {count} pedido(s).",
        "shipment_already_cancelled": "O envio consolidado está cancelado.",
        "shipment_cancelled_success": "Envio #{shipment_id} cancelado com sucesso.",
        "audit_updated": "Auditoria atualizada com sucesso.",
        "shipment_updated_success": "Envio #{shipment_id} atualizado com sucesso."
    }
}

def get_message(key: str, lang: str = "es", **kwargs) -> str:
    """Retorna un mensaje formateado en el idioma detectado (es / pt)."""
    lang_code = "pt" if lang and "pt" in lang.lower() else "es"
    msg = MESSAGES.get(lang_code, MESSAGES["es"]).get(key, key)
    try:
        return msg.format(**kwargs)
    except Exception:
        return msg

