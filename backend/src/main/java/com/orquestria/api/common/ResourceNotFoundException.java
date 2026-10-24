package com.orquestria.api.common;
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource) { super(resource + " não encontrado(a)"); }
}
