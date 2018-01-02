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

sub static_method {
    my ( $arg1 ) = @_;
    return "arg1 = @{[$arg1]}, staticField = @{[$TargetClass::static_field]}";
}

sub instance_method {
    my ( $self ) = @_;
    return "instanceField = @{[$self->{instance_field}]}";
}

OneReflect::setup_class(new OneClass("TargetClass", [
    new OneField("instance_field", 0, "OneNumber"),
    new OneField("static_field", 1, "OneString"),
  ], [
    new OneMethod("static_method", 1, "OneString", [
      new OneMethodArgument("arg1", "OneString"),
    ]),
    new OneMethod("instance_method", 0, "OneString", [
    ]),
  ]));

package TestClass;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test_method {
    my ( $self ) = @_;
    my $obj = new TargetClass();
    #console.log(`instanceMethod (direct): ${obj.instanceMethod()}`);
    #console.log(`staticMethod (direct): ${TargetClass.staticMethod("arg1value")}`);
    #console.log(`instanceField (direct): ${obj.instanceField}`);
    #console.log(`staticField (direct): ${TargetClass.staticField}`);
    my $cls = OneReflect::get_class($obj);
    if (!defined $cls) {
        print(("cls is null!") . "\n");
        return;
    }
    my $cls2 = OneReflect::get_class_by_name("TargetClass");
    if (!defined $cls2) {
        print(("cls2 is null!") . "\n");
        return;
    }
    
    my $method1 = $cls->get_method("instanceMethod");
    if (!defined $method1) {
        print(("method1 is null!") . "\n");
        return;
    }
    my $method1_result = $method1->call($obj, []);
    print(("instanceMethod: @{[$method1_result]}") . "\n");
    
    my $method2 = $cls->get_method("staticMethod");
    if (!defined $method2) {
        print(("method2 is null!") . "\n");
        return;
    }
    my $method2_result = $method2->call(undef, ["arg1value"]);
    print(("staticMethod: @{[$method2_result]}") . "\n");
    
    my $field1 = $cls->get_field("instanceField");
    if (!defined $field1) {
        print(("field1 is null!") . "\n");
        return;
    }
    $field1->set_value($obj, 6);
    my $field1_new_val = $field1->get_value($obj);
    print(("new instance field value: @{[$obj->{instance_field}]} == @{[$field1_new_val]}") . "\n");
    
    my $field2 = $cls->get_field("staticField");
    if (!defined $field2) {
        print(("field2 is null!") . "\n");
        return;
    }
    $field2->set_value(undef, "bello");
    my $field2_new_val = $field2->get_value(undef);
    print(("new static field value: @{[$TargetClass::static_field]} == @{[$field2_new_val]}") . "\n");
}

package Program;

eval {
    my $c = new TestClass();
    $c->test_method();
};
if ($@) {
    print "Exception: " . $@
}