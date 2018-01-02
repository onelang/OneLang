use strict;
use warnings;

use one;

package TargetClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    $self->{instance_field} = 5;
    return $self;
}

our $static_field = "hello";

sub staticMethod {
    my ( $arg1 ) = @_;
    return "arg1 = @{[$arg1]}, staticField = @{[$TargetClass::static_field]}";
}

sub instanceMethod {
    my ( $self ) = @_;
    return "instanceField = @{[$self->{instance_field}]}";
}

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub testMethod {
    my ( $self ) = @_;
    my $obj = new TargetClass();
    #console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
    #console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
    #console.log(`instanceField (direct): ${obj.instanceField}`);
    #console.log(`staticField (direct): ${TargetClass.staticField}`);
    my $cls = OneReflect::getClass($obj);
    if (!defined $cls) {
        print(("cls is null!") . "\n");
        return;
    }
    my $cls2 = OneReflect::getClassByName("TargetClass");
    if (!defined $cls2) {
        print(("cls2 is null!") . "\n");
        return;
    }
    
    my $method1 = $cls->getMethod("instanceMethod");
    if (!defined $method1) {
        print(("method1 is null!") . "\n");
        return;
    }
    my $method1_result = $method1->call($obj, []);
    print(("instanceMethod: @{[$method1_result]}") . "\n");
    
    my $method2 = $cls->getMethod("staticMethod");
    if (!defined $method2) {
        print(("method2 is null!") . "\n");
        return;
    }
    my $method2_result = $method2->call(undef, ["arg1value"]);
    print(("staticMethod: @{[$method2_result]}") . "\n");
    
    my $field1 = $cls->getField("instanceField");
    if (!defined $field1) {
        print(("field1 is null!") . "\n");
        return;
    }
    $field1->setValue($obj, 6);
    my $field1_new_val = $field1->getValue($obj);
    print(("new instance field value: @{[$obj->{instance_field}]} == @{[$field1_new_val]}") . "\n");
    
    my $field2 = $cls->getField("staticField");
    if (!defined $field2) {
        print(("field2 is null!") . "\n");
        return;
    }
    $field2->setValue(undef, "bello");
    my $field2_new_val = $field2->getValue(undef);
    print(("new static field value: @{[$TargetClass::static_field]} == @{[$field2_new_val]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->testMethod();
};
if ($@) {
    print "Exception: " . $@
}